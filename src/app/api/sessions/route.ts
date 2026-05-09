import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// TODO(auth): currently anyone can list every session ever stored.
// Filter by authenticated user once identity is wired up.

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("pratyax");

    const sessions = await db
      .collection("sessions")
      .find({}, {
        projection: {
          room: 1,
          updatedAt: 1,
          "state.messages": 1,
          "state.viewMode": 1,
        },
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    // Shape into something the dashboard/analytics pages can consume.
    const summarised = sessions.map((s) => {
      const messages: Array<{ role: string; text: string }> = s.state?.messages ?? [];
      // First user message is usually the topic question.
      const firstUserMsg = messages.find((m) => m.role === "user");
      const topic = firstUserMsg?.text?.slice(0, 80) ?? s.room;
      return {
        room: s.room,
        topic,
        messageCount: messages.length,
        updatedAt: s.updatedAt,
        viewMode: s.state?.viewMode ?? null,
      };
    });

    return NextResponse.json({ sessions: summarised });
  } catch (e) {
    console.error("MongoDB sessions list error:", e);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}
