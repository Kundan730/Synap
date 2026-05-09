# Synap AI - Multimodal Real-Time Tutor 🧠

Synap AI is a production-grade, highly interactive AI tutoring platform powered by **WebRTC** and the bleeding-edge **Gemini Flash Native Audio** model. It moves beyond traditional text-based chatbots by offering an ultra-low latency voice experience combined with a **Proactive Visual Whiteboard** that auto-generates code, 3D simulations, and diagrams in real-time as the AI speaks.

---

## 🌟 Key Features

- **Ultra-Low Latency Voice (WebRTC)**: Powered by LiveKit, offering real-time, interruptible voice conversations indistinguishable from a human tutor.
- **Proactive Visual Whiteboard**: 
  - ⚛️ **Live Code Sandbox**: Generates and runs multi-file React/JS projects directly on the board.
  - 📈 **Math & Graphs**: Instantly plots algebraic equations using the Desmos API.
  - 📊 **Architecture Diagrams**: Auto-generates flowcharts and state machines using Mermaid.js.
  - 🎮 **Interactive 3D Applets**: Creates physics engines, planetary simulations, and interactive HTML5 canvases on the fly.
- **Flawless Turn Detection**: Utilizes **Silero VAD** (Voice Activity Detection) to completely eliminate background noise interference and ensure the AI responds exactly when you stop talking.
- **Parallel Multimodality**: Chat seamlessly with both Voice and Text. The AI dynamically merges text inputs into its audio stream context.
- **Persistent Sessions**: Powered by MongoDB, allowing users to drop out of a session and return later with their entire whiteboard, code, and chat history perfectly restored.
- **Premium UI/UX**: Designed with a sleek, dark-mode focused aesthetic, glassmorphism, and responsive Tailwind CSS layouts.

---

## 🏗 Architecture

The application utilizes a robust Dual-Deployment architecture to separate UI rendering from long-running AI worker processes:

1. **Frontend / API (Vercel)** 
   - Built with **Next.js 16 (App Router)** and React.
   - Handles the WebRTC client connections, Whiteboard UI, and serverless API endpoints (like MongoDB sync and 3D Applet generation).
2. **AI Agent Backend (Render/Railway)**
   - A standalone Node.js process (`agent.ts`) running the `@livekit/agents` framework.
   - Manages the continuous WebSocket connection to Google Cloud's Gemini Realtime API and executes tool callbacks.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- A [LiveKit Cloud](https://cloud.livekit.io/) account.
- A [Google AI Studio](https://aistudio.google.com/) API Key.
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI.

### Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
# LiveKit Cloud Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# AI Models
GEMINI_API_KEY=your_gemini_key

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Frontend & Agent**
   This command concurrently runs the Next.js frontend and the LiveKit AI Agent worker:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser. Enter a Room Name to instantly spin up an interactive tutoring session!

---

## 🛠 Tech Stack

- **Framework**: Next.js (React), TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Real-time Comms**: LiveKit, WebRTC
- **AI / LLM**: Google Gemini Flash Native Audio Preview
- **Interactive UI**: Sandpack (CodeSandbox), Desmos, Mermaid.js
- **Database**: MongoDB

---

## 🌍 Deployment

### Deploying the Frontend (Vercel)
Connect your GitHub repository to Vercel. Ensure you add all environment variables to the Vercel Project Settings. Vercel will automatically build the Next.js application using `npm run build`.

### Deploying the Agent (Render)
Create a new "Web Service" on Render.
- **Build Command**: `npm install`
- **Start Command**: `npm run start:agent`
- Make sure to add the `.env` variables here as well. The agent includes a lightweight HTTP server on port 8080 to pass Render's health checks.

---

## 🔮 Future Integrations & Roadmap

We are constantly expanding Synap AI's capabilities. Upcoming features include:
- **ElevenLabs Custom TTS**: Support for switching from Gemini Native Audio to a `PipelineAgent` architecture, enabling ultra-realistic, highly customizable custom voices via ElevenLabs.
- **Snowflake Analytics Data-Lake**: Enterprise-grade telemetry and learning analytics integration with Snowflake to track student progression and query massive educational datasets.
- **Blackboard / Canvas LMS**: Direct integration into institutional Learning Management Systems to fetch assignments, sync grades, and authenticate student identities.

---

*Built for the future of interactive learning.*
