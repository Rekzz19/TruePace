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
        
        const completeData = { ...data, ...values };
        
        const apiData = {
            userId: 'temp-user-id', // TODO: Get from Supabase auth
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
            const response = await fetch('/api/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Profile saved:', result);
                setSuccess(true);
                setData((prev) => ({...prev, ...values}));
                router.push('/dashboard');
            } else {
                const error = await response.json();
                console.error('API Error:', error);
                setError(error.error || 'An error occurred') 
            }
        } catch (error) {
            console.error('Network Error:', error);
            setError('Network error, please try again.')
        } finally {
            setIsLoading(false);
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

            {step == 3 && <StepThree data={data} onNext={handleStepThreeNext} onBack={handleStepThreeBack} isLoading={isLoading}/>}

            {step == 3 && (
                <p className="text-red-500 text-xs mt-1">
                    {error}
                </p>
            )}
        </>
  );
}
