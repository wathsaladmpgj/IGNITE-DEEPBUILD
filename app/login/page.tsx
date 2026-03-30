"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Inside your Login component, replace the handleLogin function with this:
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!email || !password) {
    setError("Email and password are required");
    return;
  }

  try {
    // USE SUPABASE AUTH, NOT A MANUAL TABLE QUERY
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError || !data.user) {
      setError("Invalid email or password");
      return;
    }

    // Supabase Auth automatically creates the session cookie in the browser for you!
    // No need for localStorage anymore.

    // Force a router refresh so the Next.js server knows about the new cookie, then redirect
    router.refresh(); 
    router.push("/dashboard");
    
  } catch (err: unknown) {
    if (err instanceof Error) {
      setError(err.message || "An unexpected error occurred");
    } else {
      setError("An unexpected error occurred");
    }
  }
};

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Log In
        </h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border border-blue-200 rounded focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border border-blue-200 rounded focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Log In
          </button>
        </form>
        <p className="mt-4 text-center text-blue-700">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
