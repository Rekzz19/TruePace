"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface RunCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: any;
  onComplete: (runData: any) => void;
  onMissed: (runData: any) => void;
}

export function RunCompletionModal({ isOpen, onClose, run, onComplete, onMissed }: RunCompletionModalProps) {
  const [rpe, setRpe] = useState([5]); // Rate of Perceived Exertion (1-10)
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [pain, setPain] = useState("");
  const [notes, setNotes] = useState("");
  const [howFelt, setHowFelt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !run) return null;

  const handleSubmit = async (completed: boolean) => {
    setIsSubmitting(true);
    
    const runData = {
      run: {
        day: run.day,
        type: run.type,
        plannedDistance: run.distance,
        plannedIntensity: run.intensity
      },
      completed,
      actualDistance: distance,
      duration: duration,
      rpe: rpe[0],
      pain: pain,
      notes: notes,
      howFelt: howFelt,
      timestamp: new Date().toISOString()
    };

    if (completed) {
      await onComplete(runData);
    } else {
      await onMissed(runData);
    }
    
    setIsSubmitting(false);
  };

  const getRpeColor = (value: number) => {
    if (value <= 3) return 'text-green-400';
    if (value <= 5) return 'text-yellow-400';
    if (value <= 7) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRpeDescription = (value: number) => {
    if (value <= 2) return 'Very Easy';
    if (value <= 4) return 'Easy';
    if (value <= 6) return 'Moderate';
    if (value <= 8) return 'Hard';
    return 'Very Hard';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="bg-[#111111] border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">
              {run.day} - {run.type}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Planned: {run.distance} • {run.intensity} intensity
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* RPE Slider */}
          <div className="space-y-3">
            <Label className="text-white font-medium">
              Rate of Perceived Exertion (RPE): <span className={`font-bold ${getRpeColor(rpe[0])}`}>{rpe[0]}</span>
            </Label>
            <div className="text-sm text-gray-400 mb-2">{getRpeDescription(rpe[0])}</div>
            <Slider
              value={rpe}
              onValueChange={setRpe}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (Very Easy)</span>
              <span>5 (Moderate)</span>
              <span>10 (Very Hard)</span>
            </div>
          </div>

          {/* Distance and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance" className="text-white font-medium">
                Actual Distance (km)
              </Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                placeholder={run.distance}
                value={distance}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDistance(e.target.value)}
                className="bg-black border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-white font-medium">
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                placeholder="30"
                value={duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
                className="bg-black border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Pain Level */}
          <div className="space-y-2">
            <Label htmlFor="pain" className="text-white font-medium">
              Any Pain or Discomfort?
            </Label>
            <Textarea
              id="pain"
              placeholder="e.g., Slight knee pain, tight calves, etc."
              value={pain}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPain(e.target.value)}
              className="bg-black border-gray-700 text-white min-h-[80px]"
            />
          </div>

          {/* How Felt */}
          <div className="space-y-2">
            <Label htmlFor="howFelt" className="text-white font-medium">
              How Did You Feel During the Run?
            </Label>
            <Textarea
              id="howFelt"
              placeholder="e.g., Felt strong, struggled at the end, breathing was heavy, etc."
              value={howFelt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHowFelt(e.target.value)}
              className="bg-black border-gray-700 text-white min-h-[80px]"
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white font-medium">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Weather, terrain, mood, anything else the AI coach should know..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              className="bg-black border-gray-700 text-white min-h-[100px]"
            />
          </div>

          {/* AI Integration Note */}
          <div className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300">
              🤖 <strong>AI Coach:</strong> Your feedback will help me adjust your future training 
              schedule and provide personalized recommendations.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex-1 bg-[#FF6600] hover:bg-[#e65c00] text-black font-semibold"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Mark Complete'}
            </Button>
            
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Mark Missed'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
