"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import ServiceRequestForm from "../components/dashboard/ServiceRequestForm";
import AdminKanbanBoard from "../components/dashboard/AdminKanbanBoard";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Get the session directly from the browser's local storage
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      // If no session is found, kick them to login
      if (authError || !session?.user) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // 2. Fetch the user's role from your custom 'users' table
      const { data: userData, error: dbError } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!dbError && userData) {
        setRole(userData.role);
      }

      // Stop the loading state once everything is fetched
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Show a simple loading screen while checking auth to prevent flashing the dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-light flex items-center justify-center">
        <p className="text-xl font-semibold text-secondary animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  // 3. Render the dashboard
  return (
    <div className="min-h-screen bg-secondary-light p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-secondary">N-HELP Dashboard</h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <span className="text-sm">Logged in as:</span>
              <span className="font-semibold text-primary">{user?.email}</span>
              <span className="px-2 py-1 bg-primary-light text-primary rounded-md text-xs uppercase tracking-wide font-bold">
                {role}
              </span>
            </p>
          </div>

          {/* Added a quick logout button for you! */}
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            Log Out
          </button>
        </header>

        <main>
          {role === "student" || role === "staff" ? (
            <ServiceRequestForm role={role} />
          ) : (
            <AdminKanbanBoard />
          )}
        </main>
      </div>
    </div>
  );
}
