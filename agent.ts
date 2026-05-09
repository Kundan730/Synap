import { cli, defineAgent, voice, WorkerOptions, llm } from '@livekit/agents';
import * as google from '@livekit/agents-plugin-google';
import * as silero from '@livekit/agents-plugin-silero';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomEvent } from '@livekit/rtc-node';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local') });

const TUTOR_SYSTEM_PROMPT = `You are Synap AI — a world-class, empathetic real-time voice tutor for learning any concept.

RESPONSE LENGTH RULES:
- For simple questions, greetings, or confirmations: 1-2 sentences only.
- For important conceptual questions, explanations, or teaching moments: give a thorough, detailed answer (up to 5-8 sentences). Use examples and analogies.
- Always judge the importance of the question and respond proportionally.

STYLE RULES:
- Speak naturally like a real tutor in a live voice call.
- No filler words. Get to the point immediately.
- Use clear, simple language. Avoid jargon unless explaining it.
- When explaining complex topics, break them into steps.
- End with a follow-up question to keep the learner engaged.

IMPORTANT:
- You are an AI tutor that helps people learn ANY subject: programming, science, math, history, languages, etc.
- If the learner asks you to explain something in depth, DO explain it fully. Don't cut it short.
- CRITICAL CODE RULE: When generating code (especially React apps), keep the code EXTREMELY short and simplified (max 50 lines). Generating large apps will crash your backend API! Provide minimal, basic examples only.
- If the user just says "hi" or "ok", keep it brief.
- YOU HAVE DIRECT ACCESS TO THE USER'S WHITEBOARD via your tools! Do NOT ever say you cannot execute code or show things. You absolutely can.
- PROACTIVE VISUAL LEARNING (CRITICAL):
  - Do NOT just explain things verbally! Every time you explain ANY concept, you MUST trigger a visual tool simultaneously to illustrate your point on the whiteboard.
  - If explaining a process, algorithm, or relationship -> use show_mermaid_diagram
  - If explaining math or data -> use show_desmos_graph
  - If explaining science, physics, geography, or anything physical -> use generate_interactive_applet
  - If explaining code -> use open_code_editor
  - ALWAYS call a tool AS you start speaking so the user has something to look at. A session without visuals is a failure.
  
CRITICAL RULE FOR CODE/SIMULATIONS:
If the user asks for a simulation, animation, or interactive applet (like the solar system or a physics engine), you MUST use the \`generate_interactive_applet\` tool and provide the topic. NEVER try to write the code yourself. NEVER output raw code blocks in your spoken/chat response. ALWAYS delegate it using the tool so it appears on the whiteboard immediately!`;

export default defineAgent({
  entry: async (ctx) => {
    await ctx.connect();
    console.log('✅ Voice Agent connected to room:', ctx.room.name);

    const realtimeModel = new google.beta.realtime.RealtimeModel({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      apiKey: process.env.GEMINI_API_KEY,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      temperature: 0.7,
    });

    const tools: llm.ToolContext = {
      show_desmos_graph: llm.tool({
        description: 'Display an interactive Desmos mathematical graph on the whiteboard. Use this when explaining math functions, algebra, or geometry. Pass equations in LaTeX or plain math format.',
        parameters: z.object({
          equations: z.array(z.string()).describe('List of equations to plot, e.g., ["y=x^2", "y=\\\\sin(x)"]')
        }),
        execute: async ({ equations }, _) => {
          console.log('📈 LLM called show_desmos_graph:', equations);
          try {
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'TOOL_CALL', tool: 'show_desmos_graph', data: equations }));
            await ctx.room.localParticipant?.publishData(payload, { reliable: true });
            return 'Graph successfully displayed to the user.';
          } catch (e: any) {
            console.error('Failed to publish data:', e);
            return 'Error: Could not display graph.';
          }
        }
      }),
      show_mermaid_diagram: llm.tool({
        description: 'Draw a flowchart, architecture diagram, or state machine using Mermaid.js syntax.',
        parameters: z.object({
          code: z.string().describe('The Mermaid.js code. Do not include markdown code block backticks (```mermaid). Just the raw syntax.')
        }),
        execute: async ({ code }, _) => {
          console.log('📊 LLM called show_mermaid_diagram');
          try {
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'TOOL_CALL', tool: 'show_mermaid_diagram', data: code }));
            await ctx.room.localParticipant?.publishData(payload, { reliable: true });
            return 'Diagram displayed.';
          } catch (e: any) {
            console.error('Failed to publish data:', e);
            return 'Error: Could not display diagram.';
          }
        }
      }),
      generate_interactive_applet: llm.tool({
        description: 'Trigger the generation of an interactive, real-time 3D or 2D visualization applet on the whiteboard. Use this whenever the user asks for a simulation, physics demo, or interactive animation.',
        parameters: z.object({
          topic: z.string().describe('A highly detailed prompt describing what the simulation should do, e.g., "A p5.js simulation of the solar system with orbiting planets".')
        }),
        execute: async ({ topic }, _) => {
          console.log('🎮 LLM called generate_interactive_applet for topic:', topic);
          try {
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'TOOL_CALL', tool: 'generate_interactive_applet', data: topic }));
            await ctx.room.localParticipant?.publishData(payload, { reliable: true });
            return `Simulation for '${topic}' is being generated in the background and will appear on the whiteboard shortly. Tell the user it's loading.`;
          } catch (e: any) {
            console.error('Failed to publish data:', e);
            return 'Error: Failed to generate simulation. Inform the user something went wrong.';
          }
        }
      }),
      play_educational_video: llm.tool({
        description: 'Play a relevant educational video (e.g. YouTube video on the topic) directly on the whiteboard.',
        parameters: z.object({
          youtubeVideoId: z.string().describe('The exact 11-character YouTube Video ID (e.g. dQw4w9WgXcQ).'),
        }),
        execute: async ({ youtubeVideoId }, _) => {
          console.log('🎥 LLM called play_educational_video:', youtubeVideoId);
          try {
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'TOOL_CALL', tool: 'play_educational_video', data: youtubeVideoId }));
            await ctx.room.localParticipant?.publishData(payload, { reliable: true });
            return 'Video is playing.';
          } catch (e: any) {
            console.error('Failed to publish data:', e);
            return 'Error: Could not play video.';
          }
        }
      }),
      open_drawing_board: llm.tool({
        description: 'Open a freehand drawing board on the whiteboard. Use this when the user needs to sketch a diagram, solve a math problem by hand, or visually explain something.',
        parameters: z.object({}),
        execute: async (_, __) => {
          console.log('🎨 LLM called open_drawing_board');
          try {
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'TOOL_CALL', tool: 'open_drawing_board' }));
            await ctx.room.localParticipant?.publishData(payload, { reliable: true });
            return 'Drawing board is now open. The user can start sketching.';
          } catch (e: any) {
            console.error('Failed to publish data:', e);
            return 'Error: Could not open drawing board.';
          }
        }
      }),
      open_code_editor: llm.tool({
        description: 'Open an interactive code sandbox on the whiteboard. Use this for programming tutorials or coding challenges.',
        parameters: z.object({
          language: z.enum(['react', 'javascript', 'html', 'typescript', 'vue']).describe('The programming language environment to use.'),
          files: z.record(z.string(), z.string()).describe('An object containing file paths and contents. CRITICAL: KEEP CODE EXTREMELY SHORT (max 50 lines). Generating large apps will crash the server! Example: { "/App.js": "export default () => <h1>Short App</h1>;" }')
        }),
        execute: async ({ language, files }, _) => {
          console.log('💻 LLM called open_code_editor:', language);
          try {
            const payload = new TextEncoder().encode(JSON.stringify({ type: 'TOOL_CALL', tool: 'open_code_editor', data: { language, files } }));
            await ctx.room.localParticipant?.publishData(payload, { reliable: true });
            return 'Code editor is open. Tell the user they can start coding.';
          } catch (e: any) {
            console.error('Failed to publish data:', e);
            return 'Error: The code generated was too large to send over the network. Please apologize and generate a much simpler, smaller code snippet.';
          }
        }
      }),
      show_quiz: llm.tool({
        description: 'Display an interactive multiple-choice quiz on the whiteboard to test the user\'s knowledge.',
        parameters: z.object({
          question: z.string().describe('The quiz question.'),
          options: z.array(z.string()).describe('An array of 4 possible answer options.'),
          correctAnswerIndex: z.number().describe('The index (0-3) of the correct answer in the options array.'),
          explanation: z.string().describe('A helpful explanation of why the correct answer is right. This is shown after they answer.')
        }),
        execute: async ({ question, options, correctAnswerIndex, explanation }, _) => {
          console.log('📝 LLM called show_quiz:', question);
          try {
            const payload = new TextEncoder().encode(JSON.stringify({ 
              type: 'TOOL_CALL', 
              tool: 'show_quiz', 
              data: { question, options, correctAnswerIndex, explanation } 
            }));
            await ctx.room.localParticipant?.publishData(payload, { reliable: true });
            return 'Quiz is displayed on the whiteboard. Wait for the user to answer and tell you how they did.';
          } catch (e: any) {
            console.error('Failed to publish data:', e);
            return 'Error: Could not display quiz.';
          }
        }
      }),
    };

    const chatCtx = new llm.ChatContext();
    
    const agent = new voice.Agent({
      llm: realtimeModel,
      chatCtx: chatCtx,
      instructions: TUTOR_SYSTEM_PROMPT,
      turnDetection: 'vad',
      vad: await silero.VAD.load(),
      allowInterruptions: true,
      tools: tools,
    });

    const session = new voice.AgentSession();
    
    await session.start({ agent, room: ctx.room });
    console.log('✅ Agent session started!');

    // Auto-greet: generate a welcome reply via the LLM itself
    try {
      session.generateReply({ 
        instructions: 'Greet the user warmly. Introduce yourself as Synap AI tutor. Ask what they would like to learn today. Keep it to 2 sentences.'
      });
      console.log('🎤 Greeting triggered');
    } catch (e) {
      console.warn('⚠️ Could not auto-greet:', e);
    }

    // Listen for data channel messages from frontend (stop button)
    ctx.room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      try {
        const msg = new TextDecoder().decode(payload);
        if (msg === 'STOP_SPEAKING') {
          console.log('🛑 Stop command received from frontend');
          session.interrupt({ force: true });
        }
      } catch (e) {
        // ignore
      }
    });

    // Listen for Text Chat Messages and force the AI to respond
    ctx.room.on(RoomEvent.ChatMessage, async (msg: any) => {
      const text = msg.message;
      if (text) {
        console.log('📝 User sent text message:', text);
        try {
          // Avoid session.interrupt() as Gemini Realtime doesn't support truncation (causes 1011 error)
          chatCtx.addMessage({ role: 'user', content: `[TEXT MESSAGE FROM USER]: ${text}` });
          session.generateReply();
        } catch (e) {
          console.error('⚠️ Failed to reply to text message:', e);
        }
      }
    });
  },
});

cli.runApp(new WorkerOptions({ 
  agent: fileURLToPath(import.meta.url),
  agentName: 'synap-tutor',
  initializeProcessTimeout: 30_000,
  shutdownProcessTimeout: 15_000,
}));

// Dummy HTTP server for Render Web Service Health Checks
import http from 'http';
const port = process.env.PORT || 8080;
if (process.env.RENDER || process.env.PORT) {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Agent is running\\n');
  });
  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.log('⚠️ Port in use, ignoring (likely a child process for a room).');
    } else {
      console.error('HTTP Server Error:', e);
    }
  });
  server.listen(port, () => {
    console.log(`🚀 Health check server listening on port ${port}`);
  });
}
