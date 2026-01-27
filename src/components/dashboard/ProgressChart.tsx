"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";

interface ProgressChartProps {
  data: Array<{
    week: string;
    distance: number;
    runs: number;
  }>;
}

export function ProgressChart({ data }: ProgressChartProps) {
  const totalDistance = data.reduce((sum, week) => sum + week.distance, 0);
  const totalRuns = data.reduce((sum, week) => sum + week.runs, 0);
  const avgDistancePerWeek = totalDistance / data.length;
  const avgRunsPerWeek = totalRuns / data.length;

  // Calculate max values for chart scaling
  const maxDistance = Math.max(...data.map(d => d.distance));
  const maxRuns = Math.max(...data.map(d => d.runs));

  return (
    <Card className="bg-[#111111] border-gray-800">
      <CardHeader>
        <CardTitle className="text-[#FF6600] flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Progress Overview
        </CardTitle>
        <CardDescription className="text-gray-400">
          Your training progress over the past {data.length} weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[#FF6600]" />
              <span className="text-sm text-gray-400">Total Distance</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalDistance}km</div>
            <div className="text-xs text-gray-500">Avg: {avgDistancePerWeek.toFixed(1)}km/week</div>
          </div>
          
          <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[#FF6600]" />
              <span className="text-sm text-gray-400">Total Runs</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalRuns}</div>
            <div className="text-xs text-gray-500">Avg: {avgRunsPerWeek.toFixed(1)}runs/week</div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Weekly Breakdown</h4>
          {data.map((week, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{week.week}</span>
                <span className="text-white">{week.distance}km • {week.runs} runs</span>
              </div>
              
              {/* Distance Bar */}
              <div className="relative">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-[#FF6600] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(week.distance / maxDistance) * 100}%` }}
                  />
                </div>
              </div>
              
              {/* Runs Bar */}
              <div className="relative">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-500"
                    style={{ width: `${(week.runs / maxRuns) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-[#FF6600] rounded-full"></div>
            <span className="text-gray-400">Distance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-400">Runs</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
