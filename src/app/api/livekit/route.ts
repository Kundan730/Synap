import { NextRequest, NextResponse } from "next/server";
import { AccessToken, AgentDispatchClient, RoomServiceClient } from "livekit-server-sdk";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  } else if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "LiveKit Server Environment Variables not set" }, { status: 500 });
  }

  const httpHost = wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');

  const rejoin = req.nextUrl.searchParams.get("rejoin") === "true";

  try {
    const roomService = new RoomServiceClient(httpHost, apiKey, apiSecret);

    if (rejoin) {
      // On page reload: try to join the existing room WITHOUT destroying it
      // This preserves the running agent and its state
      let roomExists = false;
      try {
        const rooms = await roomService.listRooms([room]);
        roomExists = rooms.length > 0;
      } catch {}

      if (!roomExists) {
        // Room was already cleaned up — create fresh
        await roomService.createRoom({ name: room, emptyTimeout: 300, maxParticipants: 5 });
        console.log(`✅ Room "${room}" recreated (was gone)`);

        try {
          const dispatchClient = new AgentDispatchClient(httpHost, apiKey, apiSecret);
          const dispatch = await dispatchClient.createDispatch(room, 'synap-tutor');
          console.log(`✅ Agent dispatched to room "${room}", dispatch ID: ${dispatch.id}`);
        } catch (e: any) {
          console.error(`⚠️ Agent dispatch failed:`, e.message);
        }
      } else {
        console.log(`♻️ Rejoining existing room "${room}" (agent preserved)`);
      }
    } else {
      // Fresh join: delete old room, create new, dispatch agent
      try {
        await roomService.deleteRoom(room);
        console.log(`🗑️ Cleared old room "${room}"`);
      } catch {}

      await roomService.createRoom({ 
        name: room, 
        emptyTimeout: 300,
        maxParticipants: 5,
      });
      console.log(`✅ Room "${room}" created fresh`);

      try {
        const dispatchClient = new AgentDispatchClient(httpHost, apiKey, apiSecret);
        const dispatch = await dispatchClient.createDispatch(room, 'synap-tutor');
        console.log(`✅ Agent dispatched to room "${room}", dispatch ID: ${dispatch.id}`);
      } catch (e: any) {
        console.error(`⚠️ Agent dispatch failed:`, e.message);
      }
    }

    // Generate user token
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
  } catch (error: any) {
    console.error("Error generating token:", error);
    return NextResponse.json({ error: "Failed to generate token", details: error.message }, { status: 500 });
  }
}
