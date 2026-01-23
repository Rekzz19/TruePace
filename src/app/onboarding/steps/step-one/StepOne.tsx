"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepOneSchema, stepOneValues } from "./schema";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type StepOneProps = {
  data: Partial<stepOneValues>; //ask
  onNext: (values: stepOneValues) => void; //onNext function takes StepOneValues and return nothing.
};

export default function StepOne({ data, onNext }: StepOneProps) {
  const form = useForm({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      fullName: data.fullName ?? "",
      age: data.age,
      weight: data.weight,
      height: data.height,
    },
  });

  const onSubmit = (values: stepOneValues) => {
    onNext(values);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 font-sans">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic text-white uppercase">
          REACH YOUR <span className="text-[#FF6600]">TRUE PACE</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Let&apos;s personalise your running
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="bg-[#111111] border-gray-800 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              Personal Information
            </CardTitle>
            <CardDescription className="text-gray-500">
              Tell us about yourself
            </CardDescription>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <CardContent className="space-y-4">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-sm font-medium text-gray-300"
                >
                  Full name
                </Label>
                <Input
                  {...form.register("fullName")}
                  className="bg-black border-gray-800 text-white focus:border-[#FF6600] focus:ring-[#FF6600] transition-all duration-200"
                  placeholder="Abel"
                />
                {form.formState.errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Age & Weight Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="age"
                    className="text-sm font-medium text-gray-300"
                  >
                    Age
                  </Label>
                  <Input
                    {...form.register("age")}
                    className="bg-black border-gray-800 text-white focus:border-[#FF6600] focus:ring-[#FF6600] transition-all duration-200"
                  />
                  {form.formState.errors.age && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.age.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="weight"
                    className="text-sm font-medium text-gray-300"
                  >
                    Weight (kg)
                  </Label>
                  <Input
                    {...form.register("weight")}
                    className="bg-black border-gray-800 text-white focus:border-[#FF6600] focus:ring-[#FF6600] transition-all duration-200"
                  />
                  {form.formState.errors.weight && (
                    <p className="text-red-500 text-xs mt-1">
                      {form.formState.errors.weight.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Height Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="height"
                  className="text-sm font-medium text-gray-300"
                >
                  Height (feet)
                </Label>
                <Input
                  {...form.register("height")}
                  className="bg-black border-gray-800 text-white focus:border-[#FF6600] focus:ring-[#FF6600] transition-all duration-200"
                />
                {form.formState.errors.height && (
                  <p className="text-red-500 text-xs mt-1">
                    {form.formState.errors.height.message}
                  </p>
                )}
              </div>

              <CardFooter className="pt-6 px-0 flex items-center gap-4">
                <Button
                  type="submit"
                  className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-black font-bold uppercase tracking-widest py-6 transition-transform active:scale-95"
                >
                  Next
                </Button>
              </CardFooter>
            </CardContent>
          </form>
        </Card>
      </div>
    </main>
  );
}
