import { SignUp } from "@clerk/nextjs";
import { CREATOR_ROUTES } from "@/lib/creatorRoutes";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        forceRedirectUrl={`${CREATOR_ROUTES.dashboard}?signup=1`}
      />
    </div>
  );
}
