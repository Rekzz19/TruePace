"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Dashboard from "@/components/dashboard/dashboard";
import AgentChat from "@/components/chat/AgentChat";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear any local storage/session storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if there's an error
      router.push("/");
    }
  };

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <div className="container mx-auto px-6 py-4 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic text-white uppercase">
            DASHBOARD
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Keep up the pace!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <Button
            onClick={handleLogout}
            className="bg-[#FF6600] hover:bg-[#e65c00] text-black font-bold uppercase tracking-widest py-2 px-3 text-sm transition-transform active:scale-95"
          >
            Logout
          </Button>
        </div>
      </div>

      <Dashboard isChatExpanded={!isChatCollapsed} />

      {user && <AgentChat user={user} onCollapseChange={setIsChatCollapsed} />}
    </main>
  );
}
