import { NextRequest, NextResponse } from "next/server";
import { KJUR } from "jsrsasign";

// TODO(auth): like /api/livekit, this hands out host/participant signatures
// to any caller. Gate on an authenticated session and derive role from the
// user's permissions instead of trusting the request body.

const SAFE_TOKEN = /^[a-zA-Z0-9_\-:.]{1,64}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionName: unknown = body?.sessionName;
    const role: unknown = body?.role;

    if (typeof sessionName !== "string" || !SAFE_TOKEN.test(sessionName)) {
      return NextResponse.json({ error: "Invalid sessionName" }, { status: 400 });
    }

    // role: 0 = participant, 1 = host. Default to participant — a missing/invalid
    // role should never silently elevate to host (the old `role || 1` did exactly
    // that, and also coerced the legitimate value 0 up to 1).
    const roleType = role === 1 ? 1 : 0;

    const sdkKey = process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json({ error: "Missing Zoom SDK keys in .env.local" }, { status: 500 });
    }

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // Valid for 2 hours
    const oHeader = { alg: "HS256", typ: "JWT" };

    const oPayload = {
      app_key: sdkKey,
      tpc: sessionName,
      role_type: roleType,
      version: 1,
      iat: iat,
      exp: exp,
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    const signature = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, sdkSecret);

    return NextResponse.json({ signature, sdkKey });
  } catch (error) {
    console.error("Zoom signature error:", error);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}
