import "server-only";
import { createHash } from "crypto";
import { SignJWT } from "jose";

// The Go backend (epocheye_backend) owns the coupon tables that the mobile app
// reads at checkout. The creators portal authenticates with Clerk, so to call
// the Go creator endpoints we mint a short-lived creator JWT that matches
// `auth.ValidateCreatorJWT` (HS256, iss "epocheye-creators", sub = creator UUID).

// Accept the project-standard `BACKEND_API_URL` (see root .env.local / .env.example)
// as well as `GO_BACKEND_URL`, so a var-name discrepancy can't silently 502 coupons.
const GO_BACKEND_URL = (process.env.GO_BACKEND_URL || process.env.BACKEND_API_URL || "").replace(/\/$/, "");
const CREATOR_JWT_SECRET = process.env.CREATOR_JWT_SECRET || "";

// Fixed namespace so a Clerk user id always maps to the same creator UUID.
// The Go `coupons.creator_id` column is UUID-typed, but Clerk ids ("user_2ab…")
// are not UUIDs — so we derive a deterministic UUIDv5 from the Clerk id.
const CREATOR_NAMESPACE = "6b6e0f9c-2b1a-4e7d-9c3f-9a1d5e7c4b21";

function uuidToBytes(uuid) {
  const hex = uuid.replace(/-/g, "");
  const bytes = Buffer.alloc(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToUuid(bytes) {
  const hex = Buffer.from(bytes).toString("hex");
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join("-");
}

/** Deterministic UUIDv5 (SHA-1) of a Clerk user id within our namespace. */
export function creatorUuidFromClerk(userId) {
  const ns = uuidToBytes(CREATOR_NAMESPACE);
  const hash = createHash("sha1")
    .update(Buffer.concat([ns, Buffer.from(userId, "utf8")]))
    .digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  return bytesToUuid(bytes);
}

async function mintCreatorJwt(sub, email) {
  const secret = new TextEncoder().encode(CREATOR_JWT_SECRET);
  return new SignJWT({ email: email || "" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("epocheye-creators")
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secret);
}

/**
 * Forward a request to the Go backend's creator coupon API on behalf of the
 * signed-in Clerk creator. `path` is appended to the Go base URL.
 * Returns the raw `fetch` Response.
 */
export async function goCreatorFetch(path, { userId, email }, options = {}) {
  if (!GO_BACKEND_URL || !CREATOR_JWT_SECRET) {
    throw new Error("GO_BACKEND_URL or CREATOR_JWT_SECRET is not configured");
  }
  const sub = creatorUuidFromClerk(userId);
  const token = await mintCreatorJwt(sub, email);

  return fetch(`${GO_BACKEND_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}
