import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LandingPage from "@/components/auth/LandingPage";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/feed");
  }

  return <LandingPage />;
}
