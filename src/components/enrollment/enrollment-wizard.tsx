"use client";

import { useState } from "react";
import { CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { StepTracker } from "@/components/enrollment/step-tracker";
import { NameStep } from "@/components/enrollment/name-step";
import { RfidStep } from "@/components/enrollment/rfid-step";
import { FaceScanStep } from "@/components/enrollment/face-scan-step";
import { ProfilePicStep } from "@/components/enrollment/profile-pic-step";
import { ConfirmStep } from "@/components/enrollment/confirm-step";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Logo } from "../logo";

export type EnrollmentData = {
  name: string;
  rfid: string;
  faceEmbeddings: number[] | null;
  profilePicture: File | null;
};

const steps = [
  { id: 1, name: "Name" },
  { id: 2, name: "RFID" },
  { id: 3, name: "Face Scan" },
  { id: 4, name: "Profile Pic" },
  { id: 5, name: "Confirm" },
];

const initialFormData: EnrollmentData = {
    name: "",
    rfid: "",
    faceEmbeddings: null,
    profilePicture: null,
};

export function EnrollmentWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<EnrollmentData>(initialFormData);
  const router = useRouter();

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (stepNumber: number) => {
    if (stepNumber > 0 && stepNumber <= steps.length) {
      setStep(stepNumber);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setStep(1);
    router.push("/dashboard");
  };

  const updateFormData = (data: Partial<EnrollmentData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return (
    <>
      <CardHeader className="text-center relative">
        <div className="flex justify-center">
            <Logo />
        </div>
        <CardTitle className="mt-4 text-2xl font-headline">
            New Student Enrollment
        </CardTitle>
        <CardDescription>
            Follow the steps to enroll a new student into the system.
        </CardDescription>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
              <AlertDialogDescription>
                All the information you have entered will be lost. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Editing</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Cancel Enrollment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </CardHeader>
      <CardContent>
        <StepTracker currentStep={step} steps={steps} goToStep={goToStep} />
        <div className="mt-8 min-h-[300px]">
          {step === 1 && (
            <NameStep data={formData} updateData={updateFormData} next={nextStep} />
          )}
          {step === 2 && (
            <RfidStep
              data={formData}
              updateData={updateFormData}
              next={nextStep}
              back={prevStep}
            />
          )}
          {step === 3 && (
            <FaceScanStep
              data={formData}
              updateData={updateFormData}
              next={nextStep}
              back={prevStep}
            />
          )}
          {step === 4 && (
            <ProfilePicStep
              data={formData}
              updateData={updateFormData}
              next={nextStep}
              back={prevStep}
            />
          )}
          {step === 5 && (
            <ConfirmStep data={formData} back={prevStep} goToStep={goToStep} />
          )}
        </div>
      </CardContent>
    </>
  );
}
