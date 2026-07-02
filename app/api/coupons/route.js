import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { goCreatorFetch } from "@/lib/goCreatorApi";

export const runtime = "nodejs";

const COUPONS_PATH = "/api/v1/creator/coupons";

function passthrough(res, text) {
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
    },
  });
}

async function creator() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  return { userId, email: sessionClaims?.email };
}

export async function GET() {
  const who = await creator();
  if (!who) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const res = await goCreatorFetch(COUPONS_PATH, who, { method: "GET" });
    return passthrough(res, await res.text());
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "coupon backend unavailable" },
      { status: 502 },
    );
  }
}

export async function POST(req) {
  const who = await creator();
  if (!who) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  try {
    const res = await goCreatorFetch(COUPONS_PATH, who, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return passthrough(res, await res.text());
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "coupon backend unavailable" },
      { status: 502 },
    );
  }
}
