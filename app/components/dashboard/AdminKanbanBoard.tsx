"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Adjust path if needed
import toast, { Toaster } from "react-hot-toast"; // <-- 1. Import the toast library

// Define the shape of your database row
interface ServiceRequest {
    id: number;
    title: string;
    description: string;
    location: string;
    priority: string;
    time: string;
    progress: string;
}

export default function AdminKanbanBoard() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch all requests when the dashboard loads
    useEffect(() => {
        // Fetch initial data
        fetchRequests();

        // 2. Set up Supabase Realtime Listener
        const channel = supabase
            .channel('realtime-requests')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'servicerequest' },
                (payload) => {
                    const newRequest = payload.new as ServiceRequest;

                    // Add the new request to the board instantly without refreshing!
                    setRequests((prev) => [newRequest, ...prev]);

                    // 3. Trigger the Toast if it's CRITICAL
                    if (newRequest.priority === 'CRITICAL') {
                        toast.error(
                            `CRITICAL ALERT: ${newRequest.title} at ${newRequest.location}!`,
                            {
                                duration: 6000, // Stays on screen for 6 seconds
                                style: {
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    padding: '16px',
                                },
                                icon: '🚨',
                            }
                        );
                    } else {
                        // Optional: A quiet toast for normal tickets
                        toast.success(`New ticket: ${newRequest.title}`);
                    }
                }
            )
            .subscribe();

        // Cleanup the subscription when the component unmounts
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);



    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from("servicerequest")
            .select("*")
            .order("time", { ascending: false }); // Newest tickets first

        if (error) {
            console.error("Error fetching requests:", error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    // 2. The function to update the database when a button is clicked
    const updateProgress = async (id: number, newProgress: string) => {
        // Optimistic UI update: Move the card instantly for a snappy feel
        setRequests((prev) =>
            prev.map((req) => (req.id === id ? { ...req, progress: newProgress } : req))
        );

        // Actual Database update
        const { error } = await supabase
            .from("servicerequest")
            .update({ progress: newProgress })
            .eq("id", id);

        if (error) {
            console.error("Error updating progress:", error);
            // If it fails, refresh the data to revert the optimistic update
            fetchRequests();
        }
    };

    // 3. Filter the tickets into their respective columns
    // Note: We are using "new", "in_progress", and "completed" as the DB values
    const newRequests = requests.filter((req) => req.progress === "new" || !req.progress);
    const inProgressRequests = requests.filter((req) => req.progress === "in_progress");
    const completedRequests = requests.filter((req) => req.progress === "completed");

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Loading board...</div>;
    }

    // Helper function to render priority badges
    const PriorityBadge = ({ priority }: { priority: string }) => {
        const colors = {
            CRITICAL: "bg-red-100 text-red-800 border-red-200",
            MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
            LOW: "bg-blue-100 text-blue-800 border-blue-200",
        };
        const colorClass = colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
        return <span className={`text-xs px-2 py-1 rounded border font-semibold ${colorClass}`}>{priority}</span>;
    };

    return (
<>
        {/* This renders the actual popups on the screen */}
      <Toaster position="top-right" reverseOrder={false} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* COLUMN 1: NEW */}
            <div className="bg-gray-100 rounded-lg p-4 min-h-[500px] border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                    NEW <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">{newRequests.length}</span>
                </h3>
                <div className="space-y-4">
                    {newRequests.map((req) => (
                        <div key={req.id} className="bg-white p-4 rounded-md shadow-sm border border-gray-200 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900">{req.title}</h4>
                                <PriorityBadge priority={req.priority} />
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{req.description}</p>
                            <p className="text-xs text-gray-500 mb-4 font-mono">📍 {req.location}</p>

                            <button
                                onClick={() => updateProgress(req.id, "in_progress")}
                                className="mt-auto w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-sm rounded transition"
                            >
                                Mark In Progress ➡️
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div className="bg-blue-50 rounded-lg p-4 min-h-[500px] border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-4 flex justify-between items-center">
                    IN PROGRESS <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">{inProgressRequests.length}</span>
                </h3>
                <div className="space-y-4">
                    {inProgressRequests.map((req) => (
                        <div key={req.id} className="bg-white p-4 rounded-md shadow-sm border border-blue-200 flex flex-col border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900">{req.title}</h4>
                                <PriorityBadge priority={req.priority} />
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{req.description}</p>
                            <p className="text-xs text-gray-500 mb-4 font-mono">📍 {req.location}</p>

                            <button
                                onClick={() => updateProgress(req.id, "completed")}
                                className="mt-auto w-full py-2 bg-green-50 text-green-600 hover:bg-green-100 font-semibold text-sm rounded transition"
                            >
                                Mark Completed ✅
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* COLUMN 3: COMPLETED */}
            <div className="bg-green-50 rounded-lg p-4 min-h-[500px] border border-green-100">
                <h3 className="font-bold text-green-800 mb-4 flex justify-between items-center">
                    COMPLETED <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs">{completedRequests.length}</span>
                </h3>
                <div className="space-y-4">
                    {completedRequests.map((req) => (
                        <div key={req.id} className="bg-white p-4 rounded-md shadow-sm border border-green-200 flex flex-col border-l-4 border-l-green-500 opacity-75">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900 line-through">{req.title}</h4>
                                <PriorityBadge priority={req.priority} />
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{req.description}</p>
                            <p className="text-xs text-gray-500 mb-2 font-mono">📍 {req.location}</p>
                            <p className="text-xs text-green-600 font-semibold mt-auto text-center py-2 bg-green-50 rounded">
                                Resolved
                            </p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
        </>
    );
}