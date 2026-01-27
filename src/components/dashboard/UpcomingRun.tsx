"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Target } from "lucide-react";

interface UpcomingRunProps {
  schedule: Array<{
    day: string;
    type: string;
    distance: string;
    intensity: string;
    completed: boolean;
  }>;
  onComplete: (run: any) => void;
  onMissed: (run: any) => void;
}

export function UpcomingRun({ schedule, onComplete, onMissed }: UpcomingRunProps) {
  // Find the next upcoming run (not completed)
  const upcomingRun = schedule.find(run => !run.completed && run.type !== "Rest");
  
  if (!upcomingRun) {
    return (
      <Card className="bg-[#111111] border-gray-800">
        <CardHeader>
          <CardTitle className="text-[#FF6600]">🎉 All Caught Up!</CardTitle>
          <CardDescription className="text-gray-400">
            You've completed all your runs this week!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">Great job! Time to plan next week's training.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#111111] border-gray-800">
      <CardHeader>
        <CardTitle className="text-[#FF6600] flex items-center gap-2">
          <Target className="w-5 h-5" />
          Upcoming Run
        </CardTitle>
        <CardDescription className="text-gray-400">
          Your next scheduled workout
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-white">{upcomingRun.day}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{upcomingRun.type}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-400">
                Distance: <span className="text-white font-medium">{upcomingRun.distance}</span>
              </span>
              <span className="text-gray-400">
                Intensity: <span className="text-white font-medium">{upcomingRun.intensity}</span>
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => onComplete(upcomingRun)}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-black font-semibold"
            >
              Complete
            </Button>
            <Button
              variant="outline"
              onClick={() => onMissed(upcomingRun)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Missed
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
