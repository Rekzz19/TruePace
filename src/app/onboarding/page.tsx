"use client"

import { useState } from "react";

import StepOne from "./steps/step-one/StepOne";
import StepTwo from "./steps/step-two/StepTwo";
import StepThree from "./steps/step-three/StepThree";
import { stepOneValues } from "./steps/step-one/schema";
import { stepTwoValues } from "./steps/step-two/schema";
import { stepThreeValues } from "./steps/step-three/schema";

type OnboardingData = Partial<stepOneValues & stepTwoValues & stepThreeValues>;

export default function OnboardingPage(){

    const [ step, setStep] = useState(1);
    const [ data, setData] = useState<OnboardingData>({});
    const [ isLoading, setIsLoading] = useState(false);

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
        
        // Map frontend data to API format
        const apiData = {
            userId: 'temp-user-id', // TODO: Get from Supabase auth
            name: completeData.fullName,
            nickname: completeData.username,
            age: completeData.age,
            weight: completeData.weight,
            height: completeData.height,
            goal: mapRunningGoalToGoalEnum(completeData.runningGoal),
            experience: completeData.experienceLevel,
            daysAvailable: completeData.availability,
            isInjured: !!completeData.injuryHistory && completeData.injuryHistory !== 'none',
            injuryHistory: completeData.injuryHistory
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
                // TODO: Redirect to dashboard or plan generation
                setData((prev) => ({...prev, ...values}));
            } else {
                const error = await response.json();
                console.error('API Error:', error);
                // TODO: Show error to user
            }
        } catch (error) {
            console.error('Network Error:', error);
            // TODO: Show error to user
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to map running goal to Goal enum
    const mapRunningGoalToGoalEnum = (runningGoal?: string): string => {
        switch (runningGoal) {
            case 'TWO-KM':
                return 'TARGET_5K'; // Map to closest available goal
            case 'FIVE-KM':
                return 'TARGET_5K';
            case 'TEN-KM':
                return 'TARGET_10K';
            case 'MARATHON':
                return 'TARGET_10K'; // Map marathon to 10K for now
            default:
                return 'STAY_ACTIVE';
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

            {step == 3 && <StepThree data={data} onNext={handleStepThreeNext} onBack={handleStepThreeBack}/>}
        </>
  );
}
