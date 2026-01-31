"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import RunCompletionModal from "./RunCompletionModal";

interface DayData {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  trainingPlan: {
    id: string;
    activityType: string;
    targetDistanceKm: number | null;
    targetDurationMin: number | null;
    description: string;
    status: string;
  } | null;
  runLog: {
    id: string;
    actualDistanceKm: number | null;
    actualDurationMin: number | null;
    actualRpe: number | null;
    loggedAt: string;
  } | null;
  status: string;
}

interface WeekData {
  weekOffset: number;
  weekLabel: string;
  days: DayData[];
  summary: {
    totalPlannedRuns: number;
    completedRuns: number;
    totalDistance: number;
    totalDuration: number;
  };
}

export default function Dashboard() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any>(null);

  // Fetch training data
  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/runs', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWeeks(data.weeks);
        setCurrentWeekIndex(data.currentWeekIndex);
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1); // Go to previous weeks (history)
    } else if (direction === 'down' && currentWeekIndex < weeks.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1); // Go to future weeks
    }
  };

  const getCurrentWeek = () => weeks[currentWeekIndex] || null;
  const getNextRun = () => {
    const allDays = weeks.flatMap(week => week.days);
    return allDays.find(day => 
      day.trainingPlan?.activityType === 'RUN' && 
      !day.runLog && 
      new Date(day.date) > new Date()
    );
  };

  const getActivityColor = (activityType: string, status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500';
    if (activityType === 'RUN') return 'bg-orange-500';
    if (activityType === 'REST') return 'bg-gray-400';
    if (activityType === 'CROSS_TRAIN') return 'bg-blue-500';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white">Loading training data...</div>
      </div>
    );
  }

  const currentWeek = getCurrentWeek();
  const nextRun = getNextRun();

  return (
    <div className="flex-1 min-h-0 flex justify-center items-center px-4 pb-2">
      <Carousel className="w-full h-full max-w-7xl [&>div]:h-full basis-[70%]">
        <CarouselContent className="h-full">
          {/* ACTION DASHBOARD */}
          <CarouselItem className="h-full">
            <div className="h-full flex flex-col md:flex-row gap-4">
              <Card className="flex-1 bg-neutral-900 border-neutral-800 text-white p-6 flex flex-col justify-center items-start">
                <h2 className="text-gray-400 text-sm uppercase">Next Run</h2>
                {nextRun ? (
                  <>
                    <h1 className="text-4xl font-bold mt-2">
                      {nextRun.trainingPlan?.targetDistanceKm}km {nextRun.trainingPlan?.description}
                    </h1>
                    <p className="mt-2 text-gray-300">
                      {new Date(nextRun.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <button
                      className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
                      onClick={() => {
                        setSelectedRun(nextRun);
                        setIsLogModalOpen(true);
                      }}
                    >
                      Start Run
                    </button>
                  </>
                ) : (
                  <>
                    <h1 className="text-4xl font-bold mt-2">No upcoming runs</h1>
                    <p className="mt-2 text-gray-300">Check your training plan</p>
                  </>
                )}
              </Card>

              <Card className="h-1/3 md:h-full md:w-1/3 bg-white text-black p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold shrink-0">{currentWeek?.weekLabel || 'This Week'}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleScroll('up')}
                      disabled={currentWeekIndex === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      title="Previous weeks (scroll up)"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleScroll('down')}
                      disabled={currentWeekIndex === weeks.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      title="Next weeks (scroll down)"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
                  {currentWeek?.days.map((day, i) => (
                    <div
                      key={i}
                      className={`min-w-14 flex-1 rounded flex flex-col md:flex-row items-center justify-center md:justify-between p-2 md:px-3 cursor-pointer transition-colors ${
                        day.isToday ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      onClick={() => {
                        if (day.trainingPlan?.activityType === 'RUN') {
                          setSelectedRun(day);
                          setIsLogModalOpen(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 md:flex-col">
                        <div className="text-center">
                          <span className="text-xs text-gray-600 font-bold block">
                            {day.dayName}
                          </span>
                          <span className="text-lg font-bold">
                            {day.dayNumber}
                          </span>
                        </div>
                        {day.trainingPlan?.targetDistanceKm && (
                          <div className="text-xs text-gray-500 font-medium">
                            {day.trainingPlan.targetDistanceKm}km
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full mt-1 md:mt-0 shrink-0 ${getActivityColor(
                          day.trainingPlan?.activityType || 'REST',
                          day.status
                        )}`}
                        title={day.trainingPlan?.description || 'Rest day'}
                      />
                    </div>
                  ))}
                </div>
                {currentWeek && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {currentWeek.summary.completedRuns}/{currentWeek.summary.totalPlannedRuns} runs completed
                  </div>
                )}
              </Card>
            </div>
          </CarouselItem>

          {/* STATS */}
          <CarouselItem className="h-full">
            <div className="h-full px-1">
              <Card className="h-full bg-white text-black p-6 flex flex-col">
                <h2 className="text-xl font-bold mb-4 shrink-0">
                  Your Progress
                </h2>

                <div className="flex-1 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 mb-4">
                  [Chart Component]
                </div>

                <div className="shrink-0 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold">
                      {weeks.reduce((sum, week) => sum + week.summary.totalDistance, 0)}km
                    </div>
                    <div className="text-xs text-gray-500">Total Distance</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold">
                      {weeks.reduce((sum, week) => sum + week.summary.completedRuns, 0)}
                    </div>
                    <div className="text-xs text-gray-500">Completed Runs</div>
                  </div>
                </div>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>

      {isLogModalOpen && selectedRun && (
        <RunCompletionModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          runData={{
            id: selectedRun.trainingPlan?.id,
            targetDistance: selectedRun.trainingPlan?.targetDistanceKm,
            targetDuration: selectedRun.trainingPlan?.targetDurationMin,
          }}
          onSubmit={() => {
            // Refresh data after logging a run
            fetchTrainingData();
            setIsLogModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
