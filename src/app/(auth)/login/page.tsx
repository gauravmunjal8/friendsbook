import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/feed");

  return (
    <div className="min-h-screen bg-fb-gray flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-fb-blue">friendsbook</h1>
          <p className="text-xl text-fb-text-secondary mt-2">
            Connect with friends and the world around you.
          </p>
        </div>
        <div className="card p-6">
          <LoginForm />
          <hr className="my-4 border-fb-border" />
          <div className="text-center">
            <a
              href="/signup"
              className="inline-block btn-green px-6 py-2 text-base"
            >
              Create new account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
