"use client";

import { useState, useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { exhibitorMembershipOptions } from "@/types/exhibitor/registration";
import { ExhibitorMembershipProps } from "@/types/exhibitor/components";
import {
  useRealTimeExhibitorCodeValidation,
  useExhibitorMemberBenefits,
} from "@/hooks/tanstasck-query/useExhibitorCodeValidation";

export default function ExhibitorMembership({ form }: ExhibitorMembershipProps) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const { defaultBenefits, getBenefitIcon } = useExhibitorMemberBenefits();

  // Watch the exhibitor membership value
  const membership = form.watch("exhibitor_member") as boolean;

  // Real-time exhibitor code validation
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
  } = useRealTimeExhibitorCodeValidation();

  // Clear form validation errors when custom validation succeeds
  useEffect(() => {
    if (isValid && form.formState.errors.exhibitor_code) {
      form.clearErrors("exhibitor_code");
    }
  }, [isValid, form]);

  // Handle membership selection
  const handleMembershipChange = (value: string) => {
    const boolValue = value === "true";
    form.setValue("exhibitor_member", boolValue);

    if (boolValue) {
      setShowCodeInput(true);
    } else {
      setShowCodeInput(false);
      setCode("");
      form.setValue("exhibitor_code", "");
    }
  };

  // Handle code input change
  const handleCodeChange = (value: string) => {
    setCode(value);
    form.setValue("exhibitor_code", value);

    // Clear form field error when user starts typing
    if (form.formState.errors.exhibitor_code) {
      form.clearErrors("exhibitor_code");
    }
  };

  // Check if form submission should be disabled
  const isFormSubmissionDisabled = () => {
    // If user is an exhibitor member but code is invalid or empty, disable submission
    if (membership === true) {
      return !isValid || isEmpty;
    }
    // Otherwise, allow submission
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Membership Selection */}
      <FormField
        control={form.control}
        name="exhibitor_member"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base font-medium">
                Are you a member of our Exhibitor Network?
              </FormLabel>
              <FormMessage />
            </div>
            <FormControl>
              <RadioGroup
                onValueChange={handleMembershipChange}
                value={String(field.value)}
                className="grid grid-cols-1 gap-3"
              >
                {exhibitorMembershipOptions.map((option) => (
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
              Exhibitor members receive special benefits and discounted rates. If you're
              a member, you'll need to provide your valid member code.
            </FormDescription>
          </FormItem>
        )}
      />

      {/* Exhibitor Member Code Input */}
      {showCodeInput && membership === true && (
        <FormField
          control={form.control}
          name="exhibitor_code"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center gap-2">
                  Please enter your Exhibitor member code: <span className="text-red-500">*</span>
                  {showLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                  {showSuccess && !form.formState.errors.exhibitor_code && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {(showError || form.formState.errors.exhibitor_code) && (
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
                  placeholder="Enter your Exhibitor member code"
                  className={`transition-colors ${
                    showSuccess && !form.formState.errors.exhibitor_code
                      ? "border-green-500 bg-green-50"
                      : showError || form.formState.errors.exhibitor_code
                      ? "border-red-500 bg-red-50"
                      : isEmpty
                      ? "border-gray-300"
                      : "border-blue-300"
                  }`}
                />
              </FormControl>
              <FormDescription>
                <strong>Required:</strong> Enter your unique Exhibitor member code to verify your membership.
                Your code will be validated against our database to ensure it exists and is not already in use.
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
              {showSuccess && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Member benefits:</h4>
                  <ul className="space-y-1 text-sm">
                    {(benefits.length > 0 ? benefits : defaultBenefits).map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-lg">{getBenefitIcon(benefit)}</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {hasError && !isEmpty && (
                <div className="mt-4">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="w-full flex items-center justify-center gap-2" 
                    disabled={true}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Enter valid exhibitor code to continue
                  </Button>
                </div>
              )}
            </FormItem>
          )}
        />
      )}
    </div>
  );
}