"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    birthday: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    // Auto sign in after signup
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/feed");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <input
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => set("firstName", e.target.value)}
          required
          className="input"
        />
        <input
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) => set("lastName", e.target.value)}
          required
          className="input"
        />
      </div>
      <input
        type="email"
        placeholder="Email address"
        value={form.email}
        onChange={(e) => set("email", e.target.value)}
        required
        className="input"
      />
      <input
        type="password"
        placeholder="New password (6+ characters)"
        value={form.password}
        onChange={(e) => set("password", e.target.value)}
        required
        className="input"
      />
      <div>
        <label className="text-xs text-fb-text-secondary mb-1 block">
          Birthday
        </label>
        <input
          type="date"
          value={form.birthday}
          onChange={(e) => set("birthday", e.target.value)}
          className="input"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-green w-full text-base py-2.5 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>
      <p className="text-xs text-fb-text-secondary text-center">
        By clicking Sign Up, you agree to our Terms and Privacy Policy.
      </p>
    </form>
  );
}
