"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Login schema for validation
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Invalid Password"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login logic
      console.log("Login attempt:", values);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    router.push("/signup");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 font-sans">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic text-white uppercase">
          REACH YOUR <span className="text-[#FF6600]">TRUE PACE</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Beat your personal best
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="bg-[#111111] border-gray-800 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-500">
              Sign in to your account
            </CardDescription>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-300"
                >
                  Email
                </Label>
                <Input
                  {...form.register("email")}
                  type="email"
                  className="bg-black border-gray-800 text-white focus:border-[#FF6600] focus:ring-[#FF6600] transition-all duration-200"
                  placeholder="runner@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-300"
                >
                  Password
                </Label>
                <Input
                  {...form.register("password")}
                  type="password"
                  className="bg-black border-gray-800 text-white focus:border-[#FF6600] focus:ring-[#FF6600] transition-all duration-200"
                  placeholder="••••••••"
                />
                {form.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-gray-400 hover:text-gray-300 p-0 h-auto text-sm"
                >
                  Forgot password?
                </Button>
              </div>
              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-black font-bold uppercase tracking-widest py-6 transition-transform active:scale-95"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              {/* Sign Up Section - Inside the card, right under Sign In */}
              <div className="space-y-3">
                <p className="text-gray-400 text-sm text-center">
                  New to TruePace?
                </p>
                <Button
                  type="button"
                  onClick={handleSignUp}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-6 rounded-md transition-colors"
                >
                  Create Account
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </main>
  );
}