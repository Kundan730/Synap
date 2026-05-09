import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("pratyax"); // You can change the DB name
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
    const { room, state } = await req.json();
    if (!room || !state) {
      return NextResponse.json({ error: "Room and state are required" }, { status: 400 });
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
