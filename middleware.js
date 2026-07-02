import { clerkMiddleware } from "@clerk/nextjs/server";

// NOTE: We intentionally do NOT server-side `auth.protect()` /dashboard here.
// The creators app is a separate deployment on the subdomain creators.epocheye.com,
// while the Clerk instance's primary domain is epocheye.com. The session cookie is
// not always readable by this app's *server* (cross-deployment subdomain), even
// though the *client* has a valid session. Protecting server-side therefore caused
// a /dashboard ↔ /login redirect loop. Gating is done client-side via
// DashboardAuthGate (valid client session), and data calls authenticate with the
// Clerk bearer token (see lib/creatorApi.js), which is cookie-domain independent.
//
// clerkMiddleware() still runs so Clerk context is available to the app.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
