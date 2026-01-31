'use client'

import { useState } from "react";

import StepOne from "./steps/step-one/StepOne";
import StepTwo from "./steps/step-two/StepTwo";
import StepThree from "./steps/step-three/StepThree";
import { stepOneValues } from "./steps/step-one/schema";
import { stepTwoValues } from "./steps/step-two/schema";
import { stepThreeValues } from "./steps/step-three/schema";
import { useRouter }   from 'next/navigation';

type OnboardingData = Partial<stepOneValues & stepTwoValues & stepThreeValues>;

export default function OnboardingPage(){

    const [ step, setStep] = useState(1);
    const [ data, setData] = useState<OnboardingData>({});
    const [ isLoading, setIsLoading] = useState(false);
    const [ isGeneratingPlans, setIsGeneratingPlans ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ success, setSuccess ] = useState(false);

    const router = useRouter();

    
    const handleStepOneNext = (values : stepOneValues) => {
        setData((prev) => ({...prev, ...values}))
        setStep(2);
    }

    const handleStepTwoNext = (values : stepTwoValues) => {
        setData((prev) => ({...prev, ...values}))
        setStep(3);
    }

    const handleStepThreeNext = async (values: stepThreeValues) => {
        setIsLoading(true);
        setError(null);
        
        const completeData = { ...data, ...values };
        
        // Get real user ID from localStorage (set during signup)
        const userId = localStorage.getItem('userId');
        
        if (!userId) {
            setError('User session not found. Please sign up again.');
            setIsLoading(false);
            return;
        }
        
        const apiData = {
            userId: userId, // ✅ Real user ID from Supabase auth
            name: completeData.fullName,
            nickname: completeData.username,
            age: completeData.age,
            weight: completeData.weight,
            height: completeData.height,
            goal:  completeData.runningGoal || 'STAY_ACTIVE',
            experience: completeData.experienceLevel,
            daysAvailable: completeData.availability,
            isInjured: !!completeData.injuryHistory && completeData.injuryHistory !== 'none',
            injuryHistory: completeData.injuryHistory || null
        };

        try {
            // Step 1: Save user profile
            const profileResponse = await fetch('/api/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData),
            });

            if (!profileResponse.ok) {
                const error = await profileResponse.json();
                console.error('Profile API Error:', error);
                setError(error.error || 'Failed to save profile');
                return;
            }

            const profileResult = await profileResponse.json();
            console.log('Profile saved:', profileResult);

            // Step 2: Generate AI training plans
            setIsGeneratingPlans(true);
            setError(null);
            
            const plansResponse = await fetch('/api/onboarding/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId }),
            });

            if (!plansResponse.ok) {
                const error = await plansResponse.json();
                console.error('Plans API Error:', error);
                setError(`Profile saved but failed to generate training plans: ${error.error || 'Unknown error'}`);
                // Still proceed to dashboard even if plans failed
                setTimeout(() => {
                    setSuccess(true);
                    router.push('/dashboard');
                }, 2000);
                return;
            }

            const plansResult = await plansResponse.json();
            console.log('Training plans generated:', plansResult);

            // Step 3: Success - redirect to dashboard
            setSuccess(true);
            setData((prev) => ({...prev, ...values}));
            router.push('/dashboard');

        } catch (error) {
            console.error('Onboarding Error:', error);
            setError('Network error, please try again.');
        } finally {
            setIsLoading(false);
            setIsGeneratingPlans(false);
        }
    };

    const handleStepTwoBack = () => {
        setStep(1);
    }

    const handleStepThreeBack = () => {
        setStep(2);
    }
    return (
        <>
            {step === 1 && (
                <StepOne data={data} onNext={handleStepOneNext} />
            )}

            {step === 2 && <StepTwo data={data} onNext={handleStepTwoNext} onBack={handleStepTwoBack}/>}

            {step == 3 && <StepThree data={data} onNext={handleStepThreeNext} onBack={handleStepThreeBack} isLoading={isLoading} isGeneratingPlans={isGeneratingPlans}/>}

            {step == 3 && (
                <p className="text-red-500 text-xs mt-1">
                    {error}
                </p>
            )}
        </>
  );
}
