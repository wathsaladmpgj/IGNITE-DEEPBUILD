"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Basic check to see if log in simulated state exists
    const userSession = localStorage.getItem("user");
    if (!userSession) {
      router.push("/login");
    } else {
      setTimeout(() => {
        const user = JSON.parse(userSession);
        setUserEmail(user.email);
      }, 0);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <nav className="bg-blue-600 p-4 shadow-md flex justify-between items-center text-white">
        <h1 className="text-xl font-bold">Hackathon Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded transition"
        >
          Log Out
        </button>
      </nav>
      <main className="grow p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow border-l-4 border-blue-500">
          <h2 className="text-3xl font-semibold text-blue-900 mb-4">
            Welcome back!
          </h2>
          <p className="text-blue-700 text-lg">
            You are logged in as{" "}
            <span className="font-bold underline">{userEmail}</span>.
          </p>
          <div className="mt-8 p-6 bg-blue-100 rounded border border-blue-200">
            <h3 className="text-xl font-medium text-blue-800">
              Dashboard Contents
            </h3>
            <p className="text-blue-600 mt-2">
              Your application data or components can be displayed down below.
              The application logic assumes you bypassed Supabase authentication
              effectively and used a simple table insertion!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
