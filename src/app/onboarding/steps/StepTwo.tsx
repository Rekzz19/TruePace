import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";



export default function StepTwo(){
    return(
        <main className="flex flex-col items-center justify-center min-h-screen">
            <h1>REACH YOUR TRUE PACE</h1>
            <p>Let's personalise your running</p>
            
            <div >
                <Card>
                    <CardHeader>
                        <CardTitle>Running Experience</CardTitle>
                        <CardDescription>Your current fitness level</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <Label>Experience Level</Label>
                            <button>beginner</button>
                            <button>Intermediate</button>
                            <button>Advanced</button>
                            <button>Elite</button>
                        </div>

                        <div>
                            <Label>Current Weekly Distance(km)</Label>
                            <Input />
                        </div>
                
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