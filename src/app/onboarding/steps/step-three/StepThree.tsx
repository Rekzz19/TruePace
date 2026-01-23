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
} 

export default function StepThree({data, onNext, onBack, isLoading} : stepThreeProps){

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

    const router =useRouter();
    return(
        <main>
            <div>
                <h1>REACH YOUR TRUE PACE</h1>
                <p>Last Lap</p>
            </div>
            <div>
               
                <Card>
                    <CardHeader>
                        <CardTitle>Username</CardTitle>
                    </CardHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent>
                            <Label htmlFor="username">Enter your preferred username</Label>
                            <Input 
                                {...form.register("username")}
                            />
                        
                            <CardFooter className="pt-6 px-0 flex items-center gap-4">
                                <Button
                                    type="button"
                                    className="w=1/2"
                                    onClick={onReturn}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="w=1/2"
                                    // onClick={}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Finish'}
                                </Button>
                            </CardFooter>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </main>
    )
}