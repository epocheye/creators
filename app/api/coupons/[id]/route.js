import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { goCreatorFetch } from "@/lib/goCreatorApi";

export const runtime = "nodejs";

export async function DELETE(_req, { params }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "coupon id required" }, { status: 400 });
  }
  try {
    const res = await goCreatorFetch(
      `/api/v1/creator/coupons/${encodeURIComponent(id)}`,
      { userId, email: sessionClaims?.email },
      { method: "DELETE" },
    );
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "coupon backend unavailable" },
      { status: 502 },
    );
  }
}
