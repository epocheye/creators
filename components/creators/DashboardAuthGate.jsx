"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@clerk/nextjs";
import { creatorFetch } from "@/lib/creatorApi";
import { CREATOR_ROUTES } from "@/lib/creatorRoutes";

export const ACCEPT_TERMS_PATH = "/accept";
export const APPLY_PATH = "/apply";

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
 *
 * ACCESS: with `requireTerms` (the default), a signed-in creator who is not
 * approved yet is sent to APPLY_PATH, and an approved one who has not accepted
 * the current terms to ACCEPT_TERMS_PATH. If the profile can't be loaded, the
 * dashboard renders anyway: the server keeps a code off in the app until the
 * creator is approved, has accepted, and holds a site, so failing open here
 * never makes a code live.
 */
export default function DashboardAuthGate({ children, requireTerms = true }) {
	const { isLoaded, session } = useSession();
	const router = useRouter();
	const [termsChecked, setTermsChecked] = useState(!requireTerms);

	const hasClientSession = Boolean(session);

	useEffect(() => {
		if (!isLoaded) return;
		if (!hasClientSession) {
			router.replace(CREATOR_ROUTES.login);
		}
	}, [isLoaded, hasClientSession, router]);

	useEffect(() => {
		if (!requireTerms || !isLoaded || !hasClientSession) return undefined;
		let active = true;
		(async () => {
			try {
				const res = await creatorFetch("/api/creator/me");
				const json = await res.json();
				if (active && json?.success) {
					if (json.data?.status !== "active") {
						router.replace(APPLY_PATH);
						return;
					}
					if (json.data?.terms_current === false) {
						router.replace(ACCEPT_TERMS_PATH);
						return;
					}
				}
			} catch {
				// Fail open; see the TERMS note above.
			}
			if (active) startTransition(() => setTermsChecked(true));
		})();
		return () => {
			active = false;
		};
	}, [requireTerms, isLoaded, hasClientSession, router]);

	if (!isLoaded || !hasClientSession || !termsChecked) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#080808]">
				<div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
			</div>
		);
	}

	return children;
}
