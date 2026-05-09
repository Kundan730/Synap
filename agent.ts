import { cli, defineAgent, voice, WorkerOptions } from '@livekit/agents';
import * as google from '@livekit/agents-plugin-google';
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
- If the user just says "hi" or "ok", keep it brief.`;

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

    const agent = new voice.Agent({
      llm: realtimeModel,
      instructions: TUTOR_SYSTEM_PROMPT,
      turnDetection: 'realtime_llm',
      allowInterruptions: true,
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

    // Log session events for debugging
    session.on('error', (ev) => {
      console.error('❌ Session error:', ev);
    });
    session.on('close', (ev) => {
      console.log('📴 Session closed:', ev);
    });
  },
});

cli.runApp(new WorkerOptions({ 
  agent: fileURLToPath(import.meta.url),
  agentName: 'synap-tutor',
  initializeProcessTimeout: 30_000,
  shutdownProcessTimeout: 15_000,
}));
