'useState'

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepTwoSchema, stepTwoValues } from "./schema";

import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type stepTwoProps = {
    data: Partial<stepTwoValues>
    onNext: (values: stepTwoValues) => void
    onBack: () => void
}

export default function StepTwo({data, onNext, onBack} : stepTwoProps){

    const form = useForm({
        resolver: zodResolver(stepTwoSchema),
        defaultValues: {
            experienceLevel: data.experienceLevel,
            runningGoal: data.runningGoal,
            availability: data.availability,
            injuryHistory: data.injuryHistory,

        }
    })

    const onSubmit = (values : stepTwoValues) => {
        onNext(values);
    }

    const onReturn = () => {
        onBack();
    }

    return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 font-sans">
        {/* Header Section */}
        <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic text-white uppercase">
            REACH YOUR <span className="text-[#FF6600]">TRUE PACE</span>
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
            Let's personalise your running
        </p>
        </div>

        <div className="w-full max-w-md">
            <Card className="bg-[#111111] border-gray-800 shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-white">Running Experience</CardTitle>
                    <CardDescription className="text-gray-500">Your current fitness level</CardDescription>
                </CardHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <CardContent className="space-y-5">

                        {/* Experience Level */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-300">
                                Experience Level
                            </Label>
                            <select
                                {...form.register("experienceLevel")}
                                className="w-full rounded-md bg-black border border-gray-800 text-white px-3 py-2 focus:border-[#FF6600] focus:ring-[#FF6600] transition-all"
                            >
                                <option value="">Select level</option>
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                                <option value="PROFESSIONAL">Professional</option>
                            </select>
                            {form.formState.errors.experienceLevel && (
                                <p className="text-red-500 text-xs mt-1">
                                    {form.formState.errors.experienceLevel.message}
                                </p>
                            )}
                        </div>

                        {/* Running Goal */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-300">
                                Running goal (km)
                            </Label>
                            <select
                                {...form.register("runningGoal")}
                                className="w-full rounded-md bg-black border border-gray-800 text-white px-3 py-2 focus:border-[#FF6600] focus:ring-[#FF6600] transition-all"
                            >
                                <option value="">Select goal</option>
                                <option value="STAY_ACTIVE">Staying Active</option>
                                <option value="TARGET_2K">Target 2KM</option>
                                <option value="TARGET_5K">Target 5KM</option>
                                <option value="TARGET_10K">Target 10KM</option>
                                <option value="TARGET_MARATHON">Marathon - 26.2 miles</option>
                            </select>
                            {form.formState.errors.runningGoal && (
                                <p className="text-red-500 text-xs mt-1">
                                    {form.formState.errors.runningGoal.message}
                                </p>
                            )}
                        </div>

                        {/* Availability */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-300">
                                Available days
                            </Label>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                "monday",
                                "tuesday",
                                "wednesday",
                                "thursday",
                                "friday",
                                "saturday",
                                "sunday",
                                ].map((day) => (
                                <label
                                    key={day}
                                    className="flex items-center gap-2 text-sm text-gray-300 capitalize"
                                >
                                <input
                                    type="checkbox"
                                    value={day}
                                    {...form.register("availability")}
                                    className="accent-[#FF6600]"
                                />
                                {day}
                                </label>
                                ))}
                            </div>
                            {form.formState.errors.availability && (
                                <p className="text-red-500 text-xs mt-1">
                                    {form.formState.errors.availability.message}
                                </p>
                            )}
                        </div>

                        {/* Injury History */}
                        <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-300">
                            Injury history (optional)
                        </Label>
                        <textarea
                            {...form.register("injuryHistory")}
                            className="w-full min-h-[90px] rounded-md bg-black border border-gray-800 text-white px-3 py-2 focus:border-[#FF6600] focus:ring-[#FF6600] transition-all"
                            placeholder="Knee, ankle, etc."
                        />
                        </div>

                        {/* Footer + Error Near Button */}
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