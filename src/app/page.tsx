import Image from "next/image";
import {Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";


export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1>TruePace</h1>
      <p>Bet your personal best</p>

      <div>
        <Card>
          <CardContent>
            <Label>Email</Label>
            <Input />
            <Label>Password</Label>
            <Input />
            <div>
              <Button size="sm" variant="outline">Sign Up</Button>
            </div>
            <div>
              <Button size="sm" variant="outline">Forgot Password?</Button>
            </div>

            <p>New to TruePace?</p>
            <div>
              <Button size="sm" variant="outline">Create Account</Button>
            </div>

          

          </CardContent>
        </Card>
      </div>

    </main>
  );
}
