import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
      <SignIn routing="path" path="/login" signUpUrl="/signup" forceRedirectUrl="/dashboard" />
    </div>
  );
}
