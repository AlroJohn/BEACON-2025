"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  Lightbulb,
  UserCheck,
  Smartphone,
  Monitor,
} from "lucide-react";

interface FaceCaptureInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  isMobile: boolean;
}

const instructions = [
  {
    step: 1,
    title: "Set Up",
    icon: Lightbulb,
    content: ["Find good lighting", "Clean your camera", "Remove glasses/hats"],
    tip: "Good lighting = better results",
  },
  {
    step: 2,
    title: "Position Camera",
    icon: Eye,
    content: [
      "Hold device at eye level",
      "Arm's length away",
      "Look at camera",
    ],
    tip: "Keep face centered",
  },
  {
    step: 3,
    title: "Take Photo",
    icon: Camera,
    content: [
      "Position face in oval guide",
      "Wait for green border",
      "Click capture button",
      "Retake if needed",
    ],
    tip: "System detects when ready",
  },
];

export function FaceCaptureInstructions({
  isOpen,
  onClose,
  onProceed,
  isMobile,
}: FaceCaptureInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentInstruction = instructions[currentStep];
  const IconComponent = currentInstruction.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isMobile ? "max-w-[95vw] w-full p-4" : "max-w-2xl"
        } max-h-[90vh] overflow-y-auto scroll-none`}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center text-xl">
            <Camera className="w-6 h-6" />
            Face Capture Instructions
            {isMobile && <Smartphone className="w-5 h-5" />}
            {!isMobile && <Monitor className="w-5 h-5" />}
          </DialogTitle>
          <DialogDescription className="text-center">
            Quick steps for a perfect photo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Stepper */}
          <div className="flex items-center justify-center space-x-2">
            {instructions.map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors ${
                    index === currentStep
                      ? "bg-primary text-primary-foreground border-primary"
                      : index < currentStep
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-gray-200  border-gray-300"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < instructions.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 transition-colors ${
                      index < currentStep ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="bg-primary/10 rounded-full p-3">
                <IconComponent className="w-8 h-8 text-primary" />
              </div>
            </div>

            <h3 className="text-xl font-semibold">
              Step {currentInstruction.step}: {currentInstruction.title}
            </h3>

            <div className="space-y-3 text-left max-w-md mx-auto">
              {currentInstruction.content.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                  <p className="text-sm ">{item}</p>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Tip:</span>{" "}
                  {currentInstruction.tip}
                </p>
              </div>
            </div>

            {/* Visual Guide for Step 3 */}
            {currentStep === 2 && (
              <div className="bg-gray-50 rounded-lg p-3 max-w-sm mx-auto">
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full border-4 border-dashed border-gray-400 flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Position face in oval guide
                </p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              {currentStep + 1} of {instructions.length}
            </div>

            {currentStep === instructions.length - 1 ? (
              <Button
                onClick={onProceed}
                className="flex items-center gap-2 dark:text-white bg-green-600 hover:bg-green-700"
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={nextStep} className="flex items-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Skip Option */}
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onProceed}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip & start camera
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
