"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 font-sans">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic text-white uppercase mb-4">
          REACH YOUR <span className="text-[#FF6600]">TRUE PACE</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light">
          AI-powered running trainer that adapts to you
        </p>
      </div>

      {/* Features Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">AI-Powered</h3>
            <p className="text-gray-400 text-sm">Smart training plans that adapt to your progress</p>
          </div>
          
          <div className="space-y-3">
            <div className="w-16 h-16 bg-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Personalized</h3>
            <p className="text-gray-400 text-sm">Training plans built around your goals and fitness level</p>
          </div>
          
          <div className="space-y-3">
            <div className="w-16 h-16 bg-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Track Progress</h3>
            <p className="text-gray-400 text-sm">Monitor your improvement and hit new personal bests</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/signup')}
            className="bg-[#FF6600] hover:bg-[#e65c00] text-black font-bold uppercase tracking-widest py-4 px-12 text-lg transition-transform active:scale-95"
          >
            Start Your Journey
          </Button>
          
          <div className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Button
              variant="link"
              onClick={() => router.push('/login')}
              className="text-[#FF6600] hover:text-[#e65c00] p-0 h-auto font-semibold"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Testimonial or Trust Badge */}
        {/* <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            Join thousands of runners achieving their personal bests
          </p>
        </div> */}
      </div>
    </main>
  );
}
