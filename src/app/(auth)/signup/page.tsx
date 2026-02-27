import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/feed");

  return (
    <div className="min-h-screen bg-fb-gray flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <a href="/" className="text-4xl font-bold text-fb-blue">
            friendsbook
          </a>
        </div>
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-center mb-1">Create a new account</h2>
          <p className="text-fb-text-secondary text-center text-sm mb-4">
            It&apos;s quick and easy.
          </p>
          <hr className="border-fb-border mb-4" />
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
