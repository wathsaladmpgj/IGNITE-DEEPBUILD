'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center border-t-4 border-blue-500">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">Welcome</h1>
        <p className="text-blue-700 mb-8">Hackathon Project.</p>
        <div className="flex flex-col space-y-4">
          <Link href="/login" className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition">
            Log In
          </Link>
          <Link href="/signup" className="w-full bg-white text-blue-600 font-semibold py-3 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
