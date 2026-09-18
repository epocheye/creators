import { SignIn } from "@clerk/nextjs";
import { CREATOR_ROUTES } from "@/lib/creatorRoutes";

export default function LoginPage() {
	return (
		<div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
			{/*
			 * `path` must stay a literal matching the physical app/login/ folder.
			 * CREATOR_ROUTES.login is env-overridable, so binding `path` to it would
			 * silently break routing if that env var changed without moving the folder.
			 */}
			<SignIn
				routing="path"
				path="/login"
				signUpUrl={CREATOR_ROUTES.signup}
				fallbackRedirectUrl={CREATOR_ROUTES.dashboard}
			/>
		</div>
	);
}
