import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";



export default function StepOne(){
    return(
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1>REACH YOUR TRUE PACE</h1>
            <p>Let's personalise your running</p>
            
            <div >
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Tell us about yourself</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Label>Full name</Label>
                        <Input />
                        <div>
                            <Label>Age</Label>
                            <Input />

                            <Label>Weight(kg)</Label>
                            <Input />
                        </div>

                        <Label>Height(feet)</Label>
                        <Input />

                        <CardFooter>
                            <Button>Back</Button>
                            <Button>Next</Button>
                        </CardFooter>
                    </CardContent>
                </Card>

            </div>
        
        </main>
    )
}