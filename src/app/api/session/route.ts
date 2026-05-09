import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// TODO(auth): both endpoints currently let anyone read or overwrite any room's
// state given just the room name. Tie writes (and probably reads) to an
// authenticated user once auth is in place.

const SAFE_ROOM = /^[a-zA-Z0-9_\-:.]{1,64}$/;
const MAX_STATE_BYTES = 512 * 1024; // 512 KB upper bound on saved session state

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  if (!room || !SAFE_ROOM.test(room)) {
    return NextResponse.json({ error: 'Invalid "room" parameter' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("pratyax");
    const session = await db.collection("sessions").findOne({ room });

    if (session) {
      return NextResponse.json({ state: session.state });
    } else {
      return NextResponse.json({ state: null });
    }
  } catch (e) {
    console.error("MongoDB GET error:", e);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const room: unknown = body?.room;
    const state: unknown = body?.state;

    if (typeof room !== "string" || !SAFE_ROOM.test(room)) {
      return NextResponse.json({ error: 'Invalid "room"' }, { status: 400 });
    }
    if (state === null || typeof state !== "object" || Array.isArray(state)) {
      return NextResponse.json({ error: '"state" must be an object' }, { status: 400 });
    }

    // Size cap — JSON.stringify gives us the on-the-wire size, which is what
    // we'd actually persist. Reject pathological payloads early.
    const serialised = JSON.stringify(state);
    if (serialised.length > MAX_STATE_BYTES) {
      return NextResponse.json(
        { error: `state too large (max ${MAX_STATE_BYTES} bytes)` },
        { status: 413 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pratyax");

    await db.collection("sessions").updateOne(
      { room },
      { $set: { room, state, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("MongoDB POST error:", e);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
