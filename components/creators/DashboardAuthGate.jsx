"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CREATOR_ROUTES } from "@/lib/creatorRoutes";

/**
 * Client-side auth gate for the dashboard.
 *
 * Server-side protection is disabled (see middleware.js) because this app runs
 * on a separate subdomain deployment whose server cannot reliably read the
 * Clerk session cookie set for the primary domain. The client SDK *does* hold a
 * valid session, so we gate here: signed-in users see the dashboard; everyone
 * else is sent to /login. Data calls are still authorized by the Clerk bearer
 * token attached in lib/creatorApi.js, so no protected data renders to a
 * signed-out user.
 */
export default function DashboardAuthGate({ children }) {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.replace(CREATOR_ROUTES.login);
		}
	}, [isLoaded, isSignedIn, router]);

	// Wait for Clerk to resolve, and render nothing while redirecting a
	// signed-out user, to avoid flashing the dashboard shell.
	if (!isLoaded || !isSignedIn) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-[#080808]">
				<div className="h-6 w-6 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
			</div>
		);
	}

	return children;
}
