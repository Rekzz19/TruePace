"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Target, Play } from "lucide-react";

interface UpcomingRunCardProps {
  schedule: Array<{
    day: string;
    type: string;
    distance: string;
    intensity: string;
    completed: boolean;
  }>;
  onLogRun: (run: any) => void;
}

export function UpcomingRunCard({ schedule, onLogRun }: UpcomingRunCardProps) {
  // Find the next upcoming run (not completed)
  const upcomingRun = schedule.find(run => !run.completed && run.type !== "Rest");
  
  return (
    <Card className="bg-[#111111] border-gray-800 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-[#FF6600] flex items-center gap-2">
          <Target className="w-5 h-5" />
          Next Run
        </CardTitle>
        <CardDescription className="text-gray-400">
          Your upcoming scheduled workout
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {upcomingRun ? (
          <>
            <div className="space-y-6">
              {/* Run Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-white text-lg">{upcomingRun.day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{upcomingRun.type}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
                    <span className="text-gray-400">Distance</span>
                    <span className="text-white font-medium text-lg">{upcomingRun.distance}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
                    <span className="text-gray-400">Intensity</span>
                    <span className={`font-medium ${
                      upcomingRun.intensity.toLowerCase() === 'low' ? 'text-green-400' :
                      upcomingRun.intensity.toLowerCase() === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {upcomingRun.intensity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-white mb-2">Quick Tips</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Warm up for 5-10 minutes before starting</li>
                  <li>• Maintain steady breathing throughout</li>
                  <li>• Cool down and stretch after completion</li>
                </ul>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <Button
                onClick={() => onLogRun(upcomingRun)}
                className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-black font-semibold py-3 text-lg transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 mr-2" />
                Log This Run
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up! 🎉</h3>
              <p className="text-gray-400">You've completed all your runs this week</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
