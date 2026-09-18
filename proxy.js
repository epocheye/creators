import { clerkMiddleware } from "@clerk/nextjs/server";

// NOTE: deliberately NO `auth.protect()` here.
//
// This app is a separate deployment on creators.epocheye.com while the Clerk
// instance's primary domain differs, so this app's *server* cannot always read
// the session cookie even when the *client* has a valid session. Server-side
// protection of /dashboard previously produced an infinite
// /dashboard <-> /login redirect loop. The dashboard is gated client-side in
// components/creators/DashboardAuthGate.jsx instead.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
