"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { maritimeLeagueMembershipOptions } from "@/types/conference/registration";
import { MaritimeMembershipProps } from "@/types/conference/components";
import {
  useRealTimeTMLCodeValidation,
  useTMLMemberBenefits,
} from "@/hooks/tanstasck-query/useTMLCodeValidation";
import { useConferenceRegistrationStore } from "@/hooks/standard-hooks/conference/useConferenceRegistrationStore";
import Link from "next/link";

export default function MaritimeMembership({ form }: MaritimeMembershipProps) {
  const [showCodeInput, setShowCodeInput] = useState(false);

  const { setRequiresPayment, setTmlCodeValidationState } =
    useConferenceRegistrationStore();
  const { defaultBenefits, getBenefitIcon } = useTMLMemberBenefits();

  // Watch the maritime league membership value
  const membership = form.watch("isMaritimeLeagueMember");

  // Real-time TML code validation
  const {
    code,
    setCode,
    validationResult,
    isValidating,
    isValid,
    hasError,
    isEmpty,
    showLoading,
    showSuccess,
    showError,
    errorMessage,
    benefits,
  } = useRealTimeTMLCodeValidation();

  // Update payment requirement and validation state based on membership and code validation
  useEffect(() => {
    if (membership === "YES" && isValid) {
      setRequiresPayment(false);
      setTmlCodeValidationState({ isValid: true, isRequired: true });
    } else if (membership === "YES" && showCodeInput) {
      setRequiresPayment(false);
      setTmlCodeValidationState({ isValid: false, isRequired: true });
    } else if (membership === "NO") {
      setRequiresPayment(true);
      setTmlCodeValidationState({ isValid: true, isRequired: false });
    } else {
      setRequiresPayment(false);
      setTmlCodeValidationState({ isValid: true, isRequired: false });
    }
  }, [
    membership,
    isValid,
    showCodeInput,
    setRequiresPayment,
    setTmlCodeValidationState,
  ]);

  // Clear form validation errors when custom validation succeeds
  useEffect(() => {
    if (isValid && form.formState.errors.tmlMemberCode) {
      form.clearErrors("tmlMemberCode");
    }
  }, [isValid, form]);

  // Handle membership selection
  const handleMembershipChange = (value: string) => {
    form.setValue("isMaritimeLeagueMember", value as any);

    if (value === "YES") {
      setShowCodeInput(true);
    } else {
      setShowCodeInput(false);
      setCode("");
      form.setValue("tmlMemberCode", "");
    }
  };

  // Handle code input change
  const handleCodeChange = (value: string) => {
    setCode(value);
    form.setValue("tmlMemberCode", value);

    // Clear form field error when user starts typing
    if (form.formState.errors.tmlMemberCode) {
      form.clearErrors("tmlMemberCode");
    }
  };

  return (
    <div className="space-y-6">
      {/* Membership Selection */}
      <FormField
        control={form.control}
        name="isMaritimeLeagueMember"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">
                1. Are you a member of The Maritime League (TML)?
              </FormLabel>
              <FormMessage />
            </div>
            <FormControl>
              <RadioGroup
                onValueChange={handleMembershipChange}
                value={field.value}
                className="grid grid-cols-1 gap-3"
              >
                {maritimeLeagueMembershipOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <label
                      htmlFor={option.value}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription className="text-accent-foreground">
              I would like to apply for membership (please send an email by
              clicking this address:{" "}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=mlbeacon2023@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                mlbeacon2023@gmail.com
              </a>
              ).
            </FormDescription>
          </FormItem>
        )}
      />

      {/* TML Member Code Input */}
      {showCodeInput && membership === "YES" && (
        <FormField
          control={form.control}
          name="tmlMemberCode"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  2. If yes, please enter your TML member code:
                  {showLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {showSuccess && !form.formState.errors.tmlMemberCode && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {(showError || form.formState.errors.tmlMemberCode) && (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Input
                  {...field}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="Enter your TML member code"
                  className={`transition-colors ${
                    showSuccess && !form.formState.errors.tmlMemberCode
                      ? "border-green-500 bg-green-50"
                      : showError || form.formState.errors.tmlMemberCode
                      ? "border-red-500 bg-red-50"
                      : isEmpty
                      ? "border-gray-300"
                      : "border-blue-300"
                  }`}
                />
              </FormControl>
              <FormDescription>
                Enter your unique TML member code to verify your membership and
                access exclusive benefits.
              </FormDescription>
              {showError && errorMessage && (
                <div className="text-sm text-red-600 mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {showSuccess && validationResult?.message && (
                <div className="text-sm text-green-600 mt-2 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{validationResult.message}</span>
                </div>
              )}
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
