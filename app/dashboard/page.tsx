"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import ServiceRequestForm from "../components/dashboard/ServiceRequestForm";
import AdminKanbanBoard from "../components/dashboard/AdminKanbanBoard";


export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Get the session directly from the browser's local storage
      const { data: { session }, error: authError } = await supabase.auth.getSession();

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl font-semibold text-gray-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  // 3. Render the dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Logged in as: <span className="font-semibold text-blue-600">{user?.email}</span> 
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs uppercase tracking-wide font-bold">
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
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-semibold transition"
          >
            Log Out
          </button>
        </header>

        <main>
          {role === "student" || role === "staff"? (
    <ServiceRequestForm role={role} />
  ) : (
    <AdminKanbanBoard />
  )}
        </main>
      </div>
    </div>
  );
}