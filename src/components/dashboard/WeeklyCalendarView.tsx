"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface WeeklyCalendarViewProps {
  schedule: Array<{
    day: string;
    type: string;
    distance: string;
    intensity: string;
    completed: boolean;
  }>;
  onRunClick: (run: any) => void;
}

export function WeeklyCalendarView({ schedule, onRunClick }: WeeklyCalendarViewProps) {
  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (run: any) => {
    if (run.type === "Rest") {
      return <Clock className="w-4 h-4 text-gray-500" />;
    }
    if (run.completed) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-gray-600" />;
  };

  const getDayNumber = (dayName: string) => {
    const days: { [key: string]: number } = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
      'Friday': 5, 'Saturday': 6, 'Sunday': 7
    };
    return days[dayName] || 0;
  };

  // Get current day for highlighting
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentDayIndex = getDayNumber(today);

  return (
    <Card className="bg-[#111111] border-gray-800 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-[#FF6600] flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Weekly Schedule
        </CardTitle>
        <CardDescription className="text-gray-400">
          Your training plan for this week
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {schedule.map((run, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer
                ${run.completed 
                  ? 'bg-green-900/20 border-green-800/30' 
                  : run.type === "Rest"
                  ? 'bg-gray-800/50 border-gray-700/50'
                  : 'bg-[#1a1a1a] border-gray-700 hover:border-gray-600 hover:bg-[#222222]'
                }
                ${run.day === today ? 'ring-2 ring-[#FF6600] ring-opacity-50' : ''}
              `}
              onClick={() => run.type !== "Rest" && onRunClick(run)}
            >
              <div className="flex items-center gap-4">
                {getStatusIcon(run)}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">
                      {run.day}
                      {run.day === today && (
                        <span className="ml-2 text-xs bg-[#FF6600] text-black px-2 py-1 rounded-full font-semibold">
                          TODAY
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">{run.type}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                {run.distance !== "-" && (
                  <span className="text-gray-300 font-medium">{run.distance}</span>
                )}
                {run.intensity !== "-" && (
                  <span className={`font-medium ${getIntensityColor(run.intensity)}`}>
                    {run.intensity}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Summary */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-gray-600" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Rest</span>
              </div>
            </div>
            
            <div className="text-white font-medium">
              {schedule.filter(r => r.completed).length}/{schedule.length} days
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-[#FF6600] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(schedule.filter(r => r.completed).length / schedule.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
