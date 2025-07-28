import { Progress } from "@/components/ui/progress";
import { UseFormReturn } from "react-hook-form";
import { RegistrationFormData } from "@/hooks/standard-hooks/visitor/useRegistrationSchema";
import { useMemo } from "react";
import { AttendeeType } from "@prisma/client";

interface RegistrationProgressProps {
  form: UseFormReturn<RegistrationFormData>;
}

export function RegistrationProgress({ form }: RegistrationProgressProps) {
  const formValues = form.watch();
  const attendeeType = form.watch("attendeeType");
  const isStudent = attendeeType === AttendeeType.STUDENT_ACADEMIC;

  const progressData = useMemo(() => {
    let completedStepsCount = 0;
    const totalSteps = isStudent ? 7 : 8;
    let currentStepNumber = 0;

    // Step 1: Personal Info (without face capture)
    if (
      formValues.firstName &&
      formValues.lastName &&
      formValues.gender &&
      formValues.ageBracket &&
      formValues.nationality
    ) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 1);
    }

    // Step 2: Face Capture
    if (formValues.faceScannedUrl) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 2);
    }

    // Step 3: Contact Info
    if (formValues.email && formValues.mobileNumber) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 3);
    }

    // Step 4: Event Preferences
    // attendingDays is now a record: { [eventName]: string[] }
    const hasSelectedDates = Object.values(formValues.attendingDays || {}).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    const hasEventParts = (formValues.eventParts?.length ?? 0) > 0;
    const hasInterestAreas = (formValues.interestAreas?.length ?? 0) > 0;

    if (
      formValues.attendeeType &&
      hasSelectedDates &&
      hasEventParts &&
      hasInterestAreas
    ) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 4);
    }

    // Step 5: Professional Info (skip for students)
    if (isStudent) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 5);
    } else if (
      formValues.jobTitle &&
      formValues.companyName &&
      formValues.industry
    ) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 5);
    }

    // Step 6: Emergency & Safety
    if (
      formValues.emergencyContactPerson &&
      formValues.emergencyContactNumber
    ) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 6);
    }

    // Step 7: Additional Info
    if (formValues.hearAboutEvent && formValues.dataPrivacyConsent) {
      completedStepsCount++;
      currentStepNumber = Math.max(currentStepNumber, 7);
    }

    const progressPercent = (completedStepsCount / totalSteps) * 100;

    return {
      progress: progressPercent,
      currentStep: currentStepNumber,
      completedSteps: completedStepsCount,
    };
  }, [
    formValues.firstName,
    formValues.lastName,
    formValues.gender,
    formValues.ageBracket,
    formValues.nationality,
    formValues.faceScannedUrl,
    formValues.email,
    formValues.mobileNumber,
    formValues.attendeeType,
    JSON.stringify(formValues.attendingDays), // stabilize object dependency
    formValues.eventParts?.length,
    formValues.interestAreas?.length,
    formValues.jobTitle,
    formValues.companyName,
    formValues.industry,
    formValues.emergencyContactPerson,
    formValues.emergencyContactNumber,
    formValues.hearAboutEvent,
    formValues.dataPrivacyConsent,
    isStudent,
  ]);

  const stepNames = [
    "Getting Started",
    "Personal Info",
    "Face Capture",
    "Contact Info",
    "Event Preferences",
    isStudent ? "Professional Info (Skipped)" : "Professional Info",
    "Emergency & Safety",
    "Additional Info",
  ];

  const currentStepName =
    stepNames[progressData.currentStep] || "Getting Started";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Registration Progress</span>
          <span>{Math.round(progressData.progress)}% Complete</span>
        </div>
        <Progress value={progressData.progress} className="h-2 w-full" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Current: {currentStepName}</span>
          <span>
            Step {progressData.currentStep} of {stepNames.length - 1}
          </span>
        </div>
      </div>
    </div>
  );
}
