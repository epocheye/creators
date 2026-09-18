"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@clerk/nextjs";
import { CREATOR_ROUTES } from "@/lib/creatorRoutes";

/**
 * Client-side auth gate for the dashboard.
 *
 * LOOP INVARIANT - read app/login/[[...rest]]/page.jsx before editing:
 *   This gate redirects to /login ONLY when clerk-js has no client session at
 *   all (`session == null`) - exactly the state in which <SignIn> renders
 *   instead of bouncing an already-signed-in visitor back to /dashboard.
 *
 * Do NOT swap this for useAuth().isSignedIn. useAuth() defaults to
 * `treatPendingAsSignedOut: true`, so it reports signed-OUT for a session whose
 * status is "pending" while clerk-js still treats it as signed IN - that
 * disagreement is what produces a /dashboard <-> /login redirect loop.
 * useSession() exposes clerk-js's own view, so the two cannot disagree.
 *
 * Server-side protection is intentionally absent (see proxy.js).
 */
export default function DashboardAuthGate({ children }) {
	const { isLoaded, session } = useSession();
	const router = useRouter();

	const hasClientSession = Boolean(session);

	useEffect(() => {
		if (!isLoaded) return;
		if (!hasClientSession) {
			router.replace(CREATOR_ROUTES.login);
		}
	}, [isLoaded, hasClientSession, router]);

	if (!isLoaded || !hasClientSession) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#080808]">
				<div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
			</div>
		);
	}

	return children;
}
