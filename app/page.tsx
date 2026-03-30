"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-secondary-light flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center border-t-4 border-primary">
        <h1 className="text-3xl font-bold text-secondary mb-2">Welcome to N-HELP</h1>
        <p className="text-gray-500 mb-8">Service Request and Management System</p>
        <div className="flex flex-col space-y-4">
          <Link
            href="/login"
            className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-hover transition"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="w-full bg-white text-primary font-semibold py-3 border border-primary rounded-lg hover:bg-primary-light transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
