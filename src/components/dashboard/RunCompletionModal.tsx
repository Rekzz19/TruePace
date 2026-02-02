"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface RunCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  runData: {
    id: string;
    targetDistance: number; // e.g. 5
    targetDuration: number; // e.g. 30 (minutes)
  };
  onSubmit: (data: any) => void;
}

export default function RunCompletionModal({
  isOpen,
  onClose,
  runData,
  onSubmit,
}: RunCompletionModalProps) {
  // State for the form
  // We pre-fill with the TARGET data to save the user time (frictionless logging)
  const [distance, setDistance] = useState(runData.targetDistance.toString());
  const [duration, setDuration] = useState(runData.targetDuration.toString());
  const [effort, setEffort] = useState(5); // 1-10 scale
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare the payload for your API
    const payload = {
      runId: runData.id,
      actualDistance: parseFloat(distance),
      actualDuration: parseInt(duration), // minutes
      effortRating: effort,
      feedbackNotes: notes,
    };

    // Simulate API delay or call the real function
    await onSubmit(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Modal Content */}
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white italic uppercase tracking-tighter">
            Run Complete
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: The Hard Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.01"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 border border-neutral-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Time (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 border border-neutral-700"
              />
            </div>
          </div>

          {/* Section 2: Effort Slider (The Data for AI) */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Perceived Effort (RPE)
              </label>
              <span className="text-orange-500 font-bold text-lg">
                {effort}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={effort}
              onChange={(e) => setEffort(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold">
              <span>Easy</span>
              <span>Moderate</span>
              <span>Max Effort</span>
            </div>
          </div>

          {/* Section 3: Feedback (The Context for AI) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">
              How did it feel?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Felt strong, but my left knee tweaked a bit at 3km..."
              className="w-full h-24 bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 border border-neutral-700 resize-none text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-black uppercase italic tracking-wider py-4 rounded-full hover:bg-gray-200 transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Log Workout"}
          </button>
        </form>
      </div>
    </div>
  );
}
