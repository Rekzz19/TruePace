"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Good morning! Ready for your 5km today?" },
    { role: "user", content: "Actually, my legs feel a bit heavy." },
    {
      role: "assistant",
      content: "Noted. I can switch today to a Recovery Run if you prefer?",
    },
  ]);

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

      <div className="flex-1 min-h-0 flex justify-center items-center px-4 pb-2">
        <Carousel className="w-full h-full max-w-7xl [&>div]:h-full basis-[70%]">
          <CarouselContent className="h-full">
            {/* ACTION DASHBOARD */}
            <CarouselItem className="h-full">
              <div className="h-full flex flex-col md:flex-row gap-4">
                <Card className="flex-1 bg-neutral-900 border-neutral-800 text-white p-6 flex flex-col justify-center items-start">
                  <h2 className="text-gray-400 text-sm uppercase">Next Run</h2>
                  <h1 className="text-4xl font-bold mt-2">5km Tempo</h1>
                  <p className="mt-2 text-gray-300">Thursday • 18:00</p>
                  <button className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">
                    Start Run
                  </button>
                </Card>

                <Card className="h-1/3 md:h-full md:w-1/3 bg-white text-black p-4 flex flex-col">
                  <h3 className="font-bold mb-2 shrink-0">This Week</h3>
                  {/* flex-1 ensures the day list fills the rest of the card */}
                  <div className="flex-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                      <div
                        key={i}
                        className="min-w-[50px] flex-1 bg-gray-100 rounded flex flex-col md:flex-row items-center justify-center md:justify-between p-2 md:px-4"
                      >
                        <span className="text-xs text-gray-400 font-bold">
                          {day}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full mt-2 md:mt-0 ${
                            i === 3 ? "bg-orange-500" : "bg-gray-300"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
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
                      <div className="text-2xl font-bold">24km</div>
                      <div className="text-xs text-gray-500">
                        Total Distance
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="text-2xl font-bold">5:30</div>
                      <div className="text-xs text-gray-500">Avg Pace</div>
                    </div>
                  </div>
                </Card>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
      <div className="flex flex-col justify-center items-center mb-5 w-full max-w-4xl mx-auto flex-1 pt-5 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 w-full">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-orange-700 text-white rounded-br-none"
                    : "bg-neutral-800 text-gray-200 rounded-bl-none border "
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {/* Invisible element to auto-scroll to bottom could go here */}
        </div>
        <div className="h-[80px] shrink- border-t border-gray-200 p-4 flex items-center gap-2 w-full">
          <input
            type="text"
            placeholder="Talk to Truth..."
            className="flex-1 bg-gray-100 text-black rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />
          <button className="bg-gray-100 text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition">
            ↑
          </button>
        </div>
      </div>
    </main>
  );
}
