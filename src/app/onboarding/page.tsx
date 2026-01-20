"use client"

import { useState } from "react";

import StepOne from "./steps/step-one/StepOne";
import StepTwo from "./steps/step-two/StepTwo";
import StepThree from "./steps/step-three/StepThree";
import { stepOneValues } from "./steps/step-one/schema";
import { stepTwoValues } from "./steps/step-two/schema";
import { stepThreeValues } from "./steps/step-three/schema";

export default function OnboardingPage(){

    const [ step, setStep] = useState(1);
    const [ data, setData] = useState({});

    const handleStepOneNext = (values : stepOneValues) => {
        setData((prev) => ({...prev, ...values}))
        setStep(2);
        console.log("data");
    }

    const handleStepTwoNext = (values : stepTwoValues) => {
        setData((prev) => ({...prev, ...values}))
        setStep(3);
    }

    const handleStepThreeNext = (values : stepThreeValues) => {
        setData((prev) => ({...prev, ...values}))
    }

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
