import { NextRequest, NextResponse } from "next/server";
import { KJUR } from "jsrsasign";

export async function POST(req: NextRequest) {
  try {
    const { sessionName, role } = await req.json();

    if (!sessionName) {
      return NextResponse.json({ error: "Missing sessionName" }, { status: 400 });
    }

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
      role_type: role || 1, // 1 = host, 0 = participant
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
