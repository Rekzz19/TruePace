"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Target, Award } from "lucide-react";

interface StatsProgressViewProps {
  data: Array<{
    week: string;
    distance: number;
    runs: number;
  }>;
}

export function StatsProgressView({ data }: StatsProgressViewProps) {
  const totalDistance = data.reduce((sum, week) => sum + week.distance, 0);
  const totalRuns = data.reduce((sum, week) => sum + week.runs, 0);
  const avgDistancePerWeek = totalDistance / data.length;
  const avgRunsPerWeek = totalRuns / data.length;
  const currentWeek = data[data.length - 1];
  const previousWeek = data[data.length - 2];
  
  // Calculate week-over-week changes
  const distanceChange = previousWeek ? 
    ((currentWeek.distance - previousWeek.distance) / previousWeek.distance * 100).toFixed(1) : 
    '0';
  const runsChange = previousWeek ? 
    ((currentWeek.runs - previousWeek.runs) / previousWeek.runs * 100).toFixed(1) : 
    '0';

  return (
    <div className="h-full space-y-6">
      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111111] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-[#FF6600]" />
              <span className="text-xs text-gray-400">Total Distance</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalDistance}km</div>
            <div className="text-xs text-gray-500">{avgDistancePerWeek.toFixed(1)}km/week</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111111] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#FF6600]" />
              <span className="text-xs text-gray-400">Total Runs</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalRuns}</div>
            <div className="text-xs text-gray-500">{avgRunsPerWeek.toFixed(1)}runs/week</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111111] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#FF6600]" />
              <span className="text-xs text-gray-400">This Week</span>
            </div>
            <div className="text-2xl font-bold text-white">{currentWeek.distance}km</div>
            <div className={`text-xs ${parseFloat(distanceChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(distanceChange) >= 0 ? '+' : ''}{distanceChange}% vs last
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#111111] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-[#FF6600]" />
              <span className="text-xs text-gray-400">Consistency</span>
            </div>
            <div className="text-2xl font-bold text-white">{currentWeek.runs}</div>
            <div className={`text-xs ${parseFloat(runsChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(runsChange) >= 0 ? '+' : ''}{runsChange}% vs last
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      <Card className="bg-[#111111] border-gray-800 flex-1">
        <CardHeader>
          <CardTitle className="text-[#FF6600]">Weekly Progress</CardTitle>
          <CardDescription className="text-gray-400">
            Distance and run frequency over the past {data.length} weeks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chart */}
          <div className="space-y-4">
            {data.map((week, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-medium">{week.week}</span>
                  <div className="flex gap-4">
                    <span className="text-white">{week.distance}km</span>
                    <span className="text-gray-400">{week.runs} runs</span>
                  </div>
                </div>
                
                {/* Distance Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-[#FF6600] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(week.distance / Math.max(...data.map(d => d.distance))) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Runs Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(week.runs / Math.max(...data.map(d => d.runs))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#FF6600] rounded-full"></div>
                <span className="text-gray-400">Distance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-400">Runs</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              Peak: {Math.max(...data.map(d => d.distance))}km in {data.find(d => d.distance === Math.max(...data.map(d => d.distance)))?.week}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
