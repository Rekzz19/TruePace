"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepThreeSchema, stepThreeValues } from "./schema";

import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter }   from 'next/navigation';

type stepThreeProps = {
    data: Partial<stepThreeValues>
    onNext:(values : stepThreeValues) => void
    onBack: () => void
    isLoading: boolean
    isGeneratingPlans?: boolean
} 

export default function StepThree({data, onNext, onBack, isLoading, isGeneratingPlans} : stepThreeProps){

    const form = useForm({
        resolver:zodResolver(stepThreeSchema),
        defaultValues: {
            username: data.username ?? "",
        }
    });

    const onSubmit = (values: stepThreeValues) => {
        onNext(values);
    }

    const onReturn = () => {
        onBack();
    }

    const router = useRouter();
    return(
        <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 font-sans">
            {/* Header Section */}
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic text-white uppercase">
                    REACH YOUR <span className="text-[#FF6600]">TRUE PACE</span>
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                    Last Lap
                </p>
            </div>
            <div className="w-full max-w-md">
                <Card className="bg-[#111111] border-gray-800 shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-white">
                            Username
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Choose your running identity
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label 
                                    htmlFor="username" 
                                    className="text-sm font-medium text-gray-300"
                                >
                                    Enter your preferred username
                                </Label>
                                <Input 
                                    {...form.register("username")}
                                    className="bg-black border-gray-800 text-white focus:border-[#FF6600] focus:ring-[#FF6600] transition-all duration-200"
                                    placeholder="Runner123"
                                />
                                {form.formState.errors.username && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {form.formState.errors.username.message}
                                    </p>
                                )}
                            </div>
                            
                            <CardFooter className="pt-6 px-0 flex items-center gap-4">
                                <Button
                                    type="button"
                                    className="w-1/2 bg-white hover:bg-[#e65c00] text-black font-bold uppercase tracking-widest py-6 transition-transform active:scale-95"
                                    onClick={onReturn}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-1/2 bg-[#FF6600] hover:bg-[#e65c00] text-black font-bold uppercase tracking-widest py-6 transition-transform active:scale-95"
                                    disabled={isLoading || isGeneratingPlans}
                                >
                                    {isGeneratingPlans ? 'Generating Plans...' : isLoading ? 'Saving...' : 'Finish'}
                                </Button>
                            </CardFooter>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </main>
    )
}