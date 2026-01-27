"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpcomingRun } from "@/components/dashboard/UpcomingRun";
import { WeeklyCalendar } from "@/components/dashboard/WeeklyCalendar";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { RunCompletionModal } from "@/components/dashboard/RunCompletionModal";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

// Type definitions
interface ScheduleItem {
  day: string;
  type: string;
  distance: string;
  intensity: string;
  completed: boolean;
}

interface ProgressData {
  week: string;
  distance: number;
  runs: number;
}

interface UserProfile {
  displayName: string;
  goal: string;
  experienceLevel: string;
  daysAvailable: string[];
}

interface RunData {
  run: ScheduleItem;
  completed: boolean;
  actualDistance?: string;
  duration?: string;
  rpe: number;
  pain?: string;
  notes?: string;
  howFelt?: string;
  timestamp: string;
}

// Mock data for development
const mockUserProfile: UserProfile = {
  displayName: "Alex Runner",
  goal: "TARGET_5K",
  experienceLevel: "BEGINNER",
  daysAvailable: ["monday", "wednesday", "friday"],
};

const mockWeeklySchedule = [
  { day: "Monday", type: "Easy Run", distance: "2km", intensity: "Low", completed: false },
  { day: "Tuesday", type: "Rest", distance: "-", intensity: "-", completed: true },
  { day: "Wednesday", type: "Tempo Run", distance: "3km", intensity: "Medium", completed: false },
  { day: "Thursday", type: "Rest", distance: "-", intensity: "-", completed: false },
  { day: "Friday", type: "Long Run", distance: "4km", intensity: "Medium", completed: false },
  { day: "Saturday", type: "Cross Training", distance: "30min", intensity: "Low", completed: false },
  { day: "Sunday", type: "Rest", distance: "-", intensity: "-", completed: false },
];

const mockProgressData = [
  { week: "Week 1", distance: 8, runs: 3 },
  { week: "Week 2", distance: 12, runs: 4 },
  { week: "Week 3", distance: 15, runs: 4 },
  { week: "Week 4", distance: 18, runs: 5 },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduleItem[]>(mockWeeklySchedule);
  const [progressData, setProgressData] = useState<ProgressData[]>(mockProgressData);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ScheduleItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
        // TODO: Fetch actual user profile from API
        // await fetchUserProfile(user.id);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle run completion
  const handleRunComplete = (runData: RunData) => {
    // TODO: Save run data to database via API
    console.log('Run completed:', runData);
    
    // Update local state to reflect completion
    if (selectedRun) {
      setWeeklySchedule(prev => 
        prev.map(run => 
          run.day === selectedRun.day ? { ...run, completed: true } : run
        )
      );
    }
    
    setShowRunModal(false);
    setSelectedRun(null);
    
    // TODO: Trigger AI re-scheduling based on user feedback
    // await rescheduleWithAI(runData);
  };

  const handleRunMissed = (runData: RunData) => {
    // TODO: Handle missed run - trigger AI rescheduling
    console.log('Run missed:', runData);
    setShowRunModal(false);
    setSelectedRun(null);
    
    // TODO: AI Integration Point - Reschedule based on user feedback
    // Consider user's reasons, fatigue, injury concerns
    // await rescheduleWithAI({ ...runData, missed: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {userProfile.displayName}! 👋
            </h1>
            <p className="text-gray-400">
              Goal: {userProfile.goal.replace('_', ' ')} • Level: {userProfile.experienceLevel}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            onClick={() => router.push('/profile')}
          >
            Profile Settings
          </Button>
        </div>

        {/* Upcoming Run Section */}
        <UpcomingRun 
          schedule={weeklySchedule}
          onComplete={(run) => {
            setSelectedRun(run);
            setShowRunModal(true);
          }}
          onMissed={(run) => {
            setSelectedRun(run);
            setShowRunModal(true);
          }}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Calendar */}
          <WeeklyCalendar 
            schedule={weeklySchedule}
            onRunClick={(run) => {
              setSelectedRun(run);
              setShowRunModal(true);
            }}
          />

          {/* Progress Chart */}
          <ProgressChart data={progressData} />
        </div>

        {/* AI Insights Section */}
        <Card className="bg-[#111111] border-gray-800">
          <CardHeader>
            <CardTitle className="text-[#FF6600]">🤖 AI Coach Insights</CardTitle>
            <CardDescription className="text-gray-400">
              Personalized recommendations based on your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300">
                  💡 <strong>Tip:</strong> You're consistently hitting your weekly targets! 
                  Consider increasing your long run distance by 0.5km next week.
                </p>
              </div>
              <div className="p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
                <p className="text-sm text-gray-300">
                  🎯 <strong>Focus:</strong> Your Wednesday tempo runs show great improvement. 
                  Keep focusing on maintaining that pace consistency.
                </p>
              </div>
              {/* TODO: Add more AI insights based on actual user data */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run Completion Modal */}
      <RunCompletionModal
        isOpen={showRunModal}
        onClose={() => {
          setShowRunModal(false);
          setSelectedRun(null);
        }}
        run={selectedRun}
        onComplete={handleRunComplete}
        onMissed={handleRunMissed}
      />
    </main>
  );
}