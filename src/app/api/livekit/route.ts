import { NextRequest, NextResponse } from "next/server";
import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";

// TODO(auth): this route currently issues LiveKit JWTs to anyone who calls it.
// Wire up real authentication (Clerk / NextAuth / signed cookie) and derive
// `username` / room scope from the authenticated session — never trust the
// query string identity. Until then, the input validation below at least
// prevents arbitrary callers from clobbering existing rooms.

const SAFE_TOKEN = /^[a-zA-Z0-9_\-:.]{1,64}$/;

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");

  if (!room || !SAFE_TOKEN.test(room)) {
    return NextResponse.json({ error: 'Invalid "room" parameter' }, { status: 400 });
  }
  if (!username || !SAFE_TOKEN.test(username)) {
    return NextResponse.json({ error: 'Invalid "username" parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "LiveKit Server Environment Variables not set" }, { status: 500 });
  }

  const httpHost = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');

  // Default behaviour is "join existing room if present, otherwise create".
  // Destructive reset is only allowed when the caller explicitly opts in.
  // (Previously the default path called `deleteRoom` unconditionally, which
  // let any caller kick everyone out of an active room.)
  const reset = req.nextUrl.searchParams.get("reset") === "true";

  try {
    const roomService = new RoomServiceClient(httpHost, apiKey, apiSecret);

    let roomExists = false;
    try {
      const rooms = await roomService.listRooms([room]);
      roomExists = rooms.length > 0;
    } catch {
      // listRooms can fail if the room genuinely doesn't exist — treat as not present
    }

    if (reset && roomExists) {
      // Explicit reset: tear down and recreate so a fresh agent dispatches.
      try {
        await roomService.deleteRoom(room);
        console.log(`🗑️ Reset: cleared old room "${room}"`);
      } catch {}
      roomExists = false;
    }

    if (!roomExists) {
      await roomService.createRoom({ name: room, emptyTimeout: 300, maxParticipants: 5 });
      console.log(`✅ Room "${room}" created`);

      try {
        const dispatchClient = new AgentDispatchClient(httpHost, apiKey, apiSecret);
        const dispatch = await dispatchClient.createDispatch(room, 'synap-tutor');
        console.log(`✅ Agent dispatched to room "${room}", dispatch ID: ${dispatch.id}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`⚠️ Agent dispatch failed:`, msg);
      }
    } else {
      console.log(`♻️ Joining existing room "${room}" (agent preserved)`);
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
      ttl: '1h',
    });
    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating token:", error);
    return NextResponse.json({ error: "Failed to generate token", details }, { status: 500 });
  }
}
