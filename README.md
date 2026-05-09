# Synap

Real-time AI tutoring with a live whiteboard. The web app (Next.js) handles UI,
session persistence, and signing. A separate LiveKit voice agent (`agent.ts`)
runs the Gemini realtime model, listens to room audio, and pushes tool calls
back to the browser over a data channel.

## Stack

- Next.js 16 (App Router) + React 19
- LiveKit (WebRTC rooms, voice agent via `@livekit/agents`)
- Gemini 2.5 (chat, transcribe, visualize via REST; realtime audio via the agent)
- ElevenLabs (TTS fallback)
- MongoDB (session persistence)
- Tailwind v4

## Required environment

Create `.env.local`:

```bash
# Gemini (used by /api/chat, /api/visualize, /api/transcribe, and agent.ts)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash       # optional, defaults to gemini-2.5-flash

# LiveKit (rooms + agent dispatch)
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud

# MongoDB (session persistence)
MONGODB_URI=mongodb+srv://...

# ElevenLabs TTS (used by /api/voice)
ELEVENLABS_API_KEY=

# Zoom Video SDK (used by /api/zoom; only if you wire up a Zoom view)
ZOOM_SDK_KEY=
ZOOM_SDK_SECRET=
```

## Running

```bash
npm install
npm run dev          # runs Next on :3000 AND the LiveKit agent in parallel
```

Or run them separately:

```bash
npm run dev:next     # Next.js dev server only
npm run dev:agent    # LiveKit voice agent only (tsx agent.ts dev)
```

The agent registers under name `synap-tutor`. The `/api/livekit` route
dispatches it to a room when the room is first created.

## Security notes

The API routes under `src/app/api/*` are **not** authenticated yet. Until you
add an auth provider (Clerk / NextAuth / signed cookies), treat this as a demo
deployment only. Specifically:

- `/api/livekit` mints LiveKit JWTs for any caller that supplies `room` and
  `username`. Inputs are validated and the route no longer destroys an
  existing room on a normal join, but anonymous callers can still join any
  room they can guess the name of.
- `/api/zoom` mints Zoom Video SDK signatures with the same caveat. The
  `role` field defaults to `0` (participant) and only `1` is accepted as host.
- `/api/session` reads/writes MongoDB state keyed by room name with no auth.
- `/api/visualize` returns model-generated HTML. The renderer mounts it inside
  a `sandbox="allow-scripts"` iframe so it cannot reach this app's origin, but
  the model is still generating arbitrary code — keep that in mind.

Search the codebase for `TODO(auth):` to find the spots that need wiring.

## Project layout

```
agent.ts                       LiveKit voice agent (Gemini realtime)
src/app/                       Next App Router routes
src/app/api/                   Server routes (chat, visualize, voice,
                                transcribe, session, livekit, zoom)
src/components/                Renderers (Mermaid, Desmos, HTML applet,
                                Sandpack, Tldraw, Quiz, etc.)
src/lib/                       gemini.ts, elevenlabs.ts, mongodb.ts
```

## Lint

```bash
npm run lint
```
