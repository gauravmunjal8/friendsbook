"use client";

import LoginForm from "./LoginForm";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-fb-gray">
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row items-center gap-10">
        {/* Left */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-6xl font-bold text-fb-blue mb-4">friendsbook</h1>
          <p className="text-2xl text-fb-text leading-snug max-w-sm">
            Connect with friends and the world around you.
          </p>
        </div>

        {/* Right */}
        <div className="w-full max-w-sm">
          <div className="card p-4 mb-3">
            <LoginForm />
          </div>
          <div className="text-center">
            <Link href="/signup" className="btn-green text-base px-5 py-2 inline-block">
              Create new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
