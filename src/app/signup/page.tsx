"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signupSchema, SignupValues } from "./schema";

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Signup successful:', result);
        // Redirect to onboarding after successful signup
        router.push('/onboarding');
      } else {
        console.error('Signup error:', result);
        setError(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 font-sans">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic text-white uppercase">
          REACH YOUR <span className="text-[#FF6600]">TRUE PACE</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Pace Yourself to Greatness
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="bg-[#111111] border-gray-800 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-500">
              Start your running journey today
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

              <CardFooter className="pt-6 px-0 flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-black font-bold uppercase tracking-widest py-6 transition-transform active:scale-95"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>

                {/* Error Display */}
                {error && (
                  <p className="text-red-500 text-xs text-center">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Already have an account?</span>
                  <Button
                    type="button"
                    variant="link"
                    className="text-[#FF6600] hover:text-[#e65c00] p-0 h-auto"
                    onClick={() => router.push("/login")}
                  >
                    Sign In
                  </Button>
                </div>
              </CardFooter>
            </CardContent>
          </form>
        </Card>
      </div>
    </main>
  );
}
