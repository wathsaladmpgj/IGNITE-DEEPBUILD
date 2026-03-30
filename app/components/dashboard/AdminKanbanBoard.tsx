"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Adjust path if needed
import toast, { Toaster } from "react-hot-toast";

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
    
    // NEW: State to track which tab is currently selected
    const [activeTab, setActiveTab] = useState<"new" | "in_progress" | "completed">("new");

    // 1. Fetch all requests when the dashboard loads
    useEffect(() => {
        fetchRequests();

        // 2. Set up Supabase Realtime Listener
        const channel = supabase
            .channel('realtime-requests')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'servicerequest' },
                (payload) => {
                    const newRequest = payload.new as ServiceRequest;

                    // Add the new request to the board instantly without refreshing
                    setRequests((prev) => [newRequest, ...prev]);

                    // 3. Trigger the Toast if it's CRITICAL
                    if (newRequest.priority === 'CRITICAL') {
                        toast.error(
                            `CRITICAL ALERT: ${newRequest.title} at ${newRequest.location}!`,
                            {
                                duration: 6000,
                                style: {
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    padding: '16px',
                                },
                                icon: '🚨',
                            }
                        );
                    } else {
                        toast.success(`New ticket: ${newRequest.title}`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from("servicerequest")
            .select("*")
            .order("time", { ascending: false });

        if (error) {
            console.error("Error fetching requests:", error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    // 2. The function to update the database when a button is clicked
    const updateProgress = async (id: number, newProgress: string) => {
        // Optimistic UI update
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
            fetchRequests();
        }
    };

    // 3. Filter the tickets
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
            <Toaster position="top-right" reverseOrder={false} />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[600px]">
                
                {/* TABS HEADER */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6 pb-2">
                    <button
                        onClick={() => setActiveTab("new")}
                        className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${
                            activeTab === "new" 
                            ? "bg-gray-100 text-gray-800 border-b-4 border-gray-400" 
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                        }`}
                    >
                        NEW <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{newRequests.length}</span>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab("in_progress")}
                        className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${
                            activeTab === "in_progress" 
                            ? "bg-blue-50 text-blue-800 border-b-4 border-blue-500" 
                            : "text-gray-500 hover:text-blue-800 hover:bg-blue-50/50"
                        }`}
                    >
                        IN PROGRESS <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">{inProgressRequests.length}</span>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab("completed")}
                        className={`px-6 py-2 text-sm font-bold rounded-t-lg transition-all ${
                            activeTab === "completed" 
                            ? "bg-green-50 text-green-800 border-b-4 border-green-500" 
                            : "text-gray-500 hover:text-green-800 hover:bg-green-50/50"
                        }`}
                    >
                        COMPLETED <span className="ml-2 bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">{completedRequests.length}</span>
                    </button>
                </div>

                {/* TAB CONTENT AREAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* NEW TAB CONTENT */}
                    {activeTab === "new" && newRequests.length === 0 && (
                        <p className="text-gray-500 italic col-span-full">No new requests.</p>
                    )}
                    {activeTab === "new" && newRequests.map((req) => (
                        <div key={req.id} className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">{req.title}</h4>
                                <PriorityBadge priority={req.priority} />
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-grow">{req.description}</p>
                            <p className="text-xs text-gray-500 mb-4 font-mono bg-white inline-block px-2 py-1 rounded border">📍 {req.location}</p>

                            <button
                                onClick={() => updateProgress(req.id, "in_progress")}
                                className="w-full py-2.5 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold text-sm rounded-md transition"
                            >
                                Start Work (Move to In Progress) ➡️
                            </button>
                        </div>
                    ))}

                    {/* IN PROGRESS TAB CONTENT */}
                    {activeTab === "in_progress" && inProgressRequests.length === 0 && (
                        <p className="text-gray-500 italic col-span-full">No tasks currently in progress.</p>
                    )}
                    {activeTab === "in_progress" && inProgressRequests.map((req) => (
                        <div key={req.id} className="bg-white p-5 rounded-lg shadow-sm border border-blue-200 flex flex-col border-l-4 border-l-blue-500 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 text-lg">{req.title}</h4>
                                <PriorityBadge priority={req.priority} />
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-grow">{req.description}</p>
                            <p className="text-xs text-gray-500 mb-4 font-mono bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">📍 {req.location}</p>

                            <button
                                onClick={() => updateProgress(req.id, "completed")}
                                className="w-full py-2.5 bg-green-100 text-green-700 hover:bg-green-200 font-bold text-sm rounded-md transition"
                            >
                                Mark as Completed ✅
                            </button>
                        </div>
                    ))}

                    {/* COMPLETED TAB CONTENT */}
                    {activeTab === "completed" && completedRequests.length === 0 && (
                        <p className="text-gray-500 italic col-span-full">No completed tasks yet.</p>
                    )}
                    {activeTab === "completed" && completedRequests.map((req) => (
                        <div key={req.id} className="bg-white p-5 rounded-lg shadow-sm border border-green-200 flex flex-col border-l-4 border-l-green-500 opacity-80 hover:opacity-100 transition">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 text-lg line-through text-gray-400">{req.title}</h4>
                                <PriorityBadge priority={req.priority} />
                            </div>
                            <p className="text-sm text-gray-500 mb-3 line-clamp-3 flex-grow">{req.description}</p>
                            <p className="text-xs text-gray-400 mb-4 font-mono bg-green-50 inline-block px-2 py-1 rounded border border-green-100">📍 {req.location}</p>
                            
                            <div className="w-full py-2 bg-green-50 border border-green-100 text-green-700 font-bold text-sm rounded-md text-center">
                                Task Resolved 🎉
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </>
    );
}