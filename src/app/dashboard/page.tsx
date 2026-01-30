"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Dashboard from "@/components/dashboard/dashboard";
import Chat from "@/components/chat/chat";

  export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <div className="container mx-auto px-6 py-4 shrink-0">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic text-white uppercase">
          DASHBOARD
        </h1>
        <p className="text-gray-400 text-sm md:text-base">Keep up the pace!</p>
      </div>

      <Dashboard />
      
      {user && <Chat user={user} />}
    </main>
  );
}
