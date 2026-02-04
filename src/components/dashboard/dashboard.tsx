"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import RunCompletionModal from "./RunCompletionModal";

export default function Dashboard() {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const sampleData = {
    id: 'd',
    targetDistance: 3,
    targetDuration: 4,
  };

  return (
    <div className="flex-1 min-h-0 flex justify-center items-center px-4 pb-2">
      <Carousel className="w-full h-full max-w-7xl [&>div]:h-full basis-[70%]">
        <CarouselContent className="h-full">
          {/* ACTION DASHBOARD */}
          <CarouselItem className="h-full">
            <div className="h-full flex flex-col md:flex-row gap-4">
              <Card className="flex-[3] bg-neutral-900 border-neutral-800 text-white p-6 flex flex-col justify-center items-start">
                <h2 className="text-gray-400 text-sm uppercase">Next Run</h2>
                <h1 className="text-4xl font-bold mt-2">5km Tempo</h1>
                <p className="mt-2 text-gray-300">Thursday • 18:00</p>
                <button
                  className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition"
                  onClick={() => setIsLogModalOpen(true)}
                >
                  Start Run
                </button>
              </Card>

              <Card className="flex-[2] bg-white text-black p-4 flex flex-col">
                <h3 className="font-bold mb-2 shrink-0">This Week</h3>
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
                    <div className="text-xs text-gray-500">Total Distance</div>
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

      {isLogModalOpen && (
        <RunCompletionModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          runData={sampleData}
          onSubmit={() => {}}
        />
      )}
    </div>
  );
}
