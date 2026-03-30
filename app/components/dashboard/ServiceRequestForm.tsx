"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FormProps {
  role: string;
}

export default function ServiceRequestForm({ role }: FormProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  // NEW STATES FOR GEMINI:
  const [description, setDescription] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // 1. Role Check: Only staff and students can see the form
  if (role !== "staff" && role !== "student") {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        You do not have permission to submit service requests.
      </div>
    );
  }

  const handleGetAIFixes = async () => {
    if (!description.trim()) {
      setStatus({ type: "error", message: "Please type a description first!" });
      return;
    }

    setIsThinking(true);
    setAiSuggestion(""); // Clear previous suggestions

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch (error) {
      console.error("Failed to fetch AI suggestions", error);
    }

    setIsThinking(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    // FIX: Save the form reference before any async operations!
    const form = e.currentTarget;

    const formData = new FormData(form);

    // 2. Prepare the data matching your schema
    const requestData = {
      title: formData.get("title"),
      description: formData.get("description"),
      location: formData.get("location"),
      priority: formData.get("priority"),
      time: new Date().toISOString(), // Automatically grabs current timestamp
    };

    // 3. Submit to Supabase
    const { error } = await supabase
      .from("servicerequest")
      .insert([requestData]);

    if (error) {
      setStatus({ type: "error", message: error.message });
    } else {
      setStatus({ type: "success", message: "Ticket submitted successfully!" });
      // FIX: Use the saved reference to reset the form
      form.reset();
      setDescription("");
      setAiSuggestion("");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-8 text-secondary">
        New Service Request
      </h2>

      {status.type && (
        <div
          className={`p-4 mb-6 rounded-lg text-sm ${status.type === "success" ? "bg-primary-light text-primary border border-primary-light" : "bg-red-50 text-red-700 border border-red-100"}`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-secondary mb-1"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-gray-900 bg-white"
            placeholder="e.g., Broken Microphone"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-secondary mb-1"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-gray-900 bg-white"
            placeholder="e.g., Lecture Hall 2"
          />
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-secondary mb-1"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            required
            defaultValue="MEDIUM" // Added a safe default value for React
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-gray-900 bg-white"
          >
            <option value="LOW">Low - Routine issue</option>
            <option value="MEDIUM">Medium - Needs attention soon</option>
            <option value="CRITICAL">
              Critical - Immediate action required
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-secondary mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)} // Track what they type
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition text-gray-900 bg-white"
            placeholder="Describe the issue in detail..."
          />

          {/* THE AI BUTTON */}
          <button
            type="button"
            onClick={handleGetAIFixes}
            disabled={isThinking || !description}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-secondary-light text-secondary hover:bg-gray-200 rounded-lg text-sm font-semibold transition border border-gray-200 disabled:opacity-50"
          >
            {isThinking ? "✨ AI is thinking..." : "✨ Get AI Quick Fixes"}
          </button>

          {/* THE AI RESPONSE BOX */}
          {aiSuggestion && (
            <div className="mt-4 p-5 bg-secondary-light rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-secondary font-bold mb-3 flex items-center gap-2">
                🤖 AI Troubleshooting Assistant
              </h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiSuggestion}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 shadow-sm"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
