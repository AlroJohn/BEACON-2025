"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form } from "@/components/ui/form";
import {
  registrationSchema,
  RegistrationFormData,
  defaultValues,
} from "@/hooks/standard-hooks/visitor/useRegistrationSchema";
import { useRegistrationMutation } from "@/hooks/tanstasck-query/useRegistrationMutation";
import { useRegistrationStore } from "@/stores/registrationStore";
import { useVisitorRegistrationStore } from "@/stores/visitorRegistrationStore";
import { useEmailValidation } from "@/hooks/tanstasck-query/useEmailValidation";

// Import all components

import { ProfessionalInfo } from "./visitor-components/ProfessionalInfo";
import { EventPreferences } from "./visitor-components/EventPreferences";
import { EmergencySafety } from "./visitor-components/EmergencySafety";
import { AdditionalInfo } from "./visitor-components/AdditionalInfo";
import { RegistrationProgress } from "./components/RegistrationProgress";
import { UserDetails } from "./visitor-components/UserDetails";
import { UserAccounts } from "./visitor-components/UserAccounts";
import { Icon } from "@iconify/react";
import { DraftManagerVisitor } from "./components/DraftManager";
import { ModeToggle } from "@/components/reuseable/page-components/ModeToggle";

export default function VisitorRegistrationPage() {
  const {
    isSubmitting,
    setIsSubmitting,
    showSuccessDialog,
    setShowSuccessDialog,
    registrationData,
    setRegistrationData,
    reset: resetVisitorStore,
  } = useVisitorRegistrationStore();

  // Refs for measuring container heights
  const personalContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const contactContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const eventContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const professionalContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const emergencyContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const additionalContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const submitContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // State for dynamic vertical line counts
  const [personalLineCount, setPersonalLineCount] = useState(6);
  const [contactLineCount, setContactLineCount] = useState(6);
  const [eventLineCount, setEventLineCount] = useState(6);
  const [professionalLineCount, setProfessionalLineCount] = useState(6);
  const [emergencyLineCount, setEmergencyLineCount] = useState(6);
  const [additionalLineCount, setAdditionalLineCount] = useState(6);

  const registrationMutation = useRegistrationMutation();
  const { clearFormData } = useRegistrationStore();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues,
    mode: "onChange",
  });

  const email = form.watch("email");
  const attendeeType = form.watch("attendeeType");
  const { data: emailCheck } = useEmailValidation(email, "visitor");

  // Watch additional form fields that can cause dynamic height changes
  const gender = form.watch("gender");
  const interestAreas = form.watch("interestAreas");
  const attendingDays = form.watch("attendingDays");

  // Function to calculate number of vertical lines based on content container height
  const calculateLineCount = useCallback(
    (containerRef: React.RefObject<HTMLDivElement>) => {
      if (!containerRef.current) {
        console.log("calculateLineCount: No container ref");
        return 6; // Default fallback
      }

      // Find the specific content container with the h-fit classes
      const contentContainer = containerRef.current.querySelector(
        ".h-fit"
      ) as HTMLElement;
      if (!contentContainer) {
        console.log("calculateLineCount: No content container found");
        return 6;
      }

      const contentHeight = contentContainer.offsetHeight;
      const titleHeight = 32; // h1 title height approximately
      const titleGap = 16; // gap-4 = 16px
      const iconHeight = 48; // lg:h-12 lg:w-12 = 48px on large screens
      const iconSpacing = 4; // space-y-1 = 4px

      // Calculate total height (content + title + gaps)
      const totalContentHeight = contentHeight + titleHeight + titleGap;

      // Calculate available height for lines (subtract icon height and spacing)
      const availableHeight = totalContentHeight - iconHeight - iconSpacing;

      // Each line is h-2 (8px) + space-y-1 (4px) = 12px total
      const lineHeight = 8; // h-2 = 8px
      const lineSpacing = 4; // space-y-1 = 4px between elements
      const totalLineHeight = lineHeight + lineSpacing;

      // Calculate how many lines can fit
      const lineCount = Math.max(
        1,
        Math.floor(availableHeight / totalLineHeight)
      );

      console.log(
        `calculateLineCount: contentHeight=${contentHeight}, totalHeight=${totalContentHeight}, available=${availableHeight}, lines=${lineCount}`
      );
      return lineCount;
    },
    []
  );

  // Debounced update function to prevent excessive updates
  const debouncedUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedUpdateLineCounts = useCallback(() => {
    console.log("debouncedUpdateLineCounts: Starting update");
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }

    debouncedUpdateRef.current = setTimeout(() => {
      console.log("debouncedUpdateLineCounts: Executing delayed update");

      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const personalCount = calculateLineCount(personalContainerRef);
        const contactCount = calculateLineCount(contactContainerRef);
        const eventCount = calculateLineCount(eventContainerRef);
        const professionalCount = calculateLineCount(professionalContainerRef);
        const emergencyCount = calculateLineCount(emergencyContainerRef);
        const additionalCount = calculateLineCount(additionalContainerRef);

        setPersonalLineCount(personalCount);
        setContactLineCount(contactCount);
        setEventLineCount(eventCount);
        setProfessionalLineCount(professionalCount);
        setEmergencyLineCount(emergencyCount);
        setAdditionalLineCount(additionalCount);

        console.log("debouncedUpdateLineCounts: Line counts updated", {
          personal: personalCount,
          contact: contactCount,
          event: eventCount,
        });
      });
    }, 150);
  }, [calculateLineCount]);

  // Update line counts when containers resize
  useEffect(() => {
    const updateLineCounts = () => {
      setPersonalLineCount(calculateLineCount(personalContainerRef));
      setContactLineCount(calculateLineCount(contactContainerRef));
      setEventLineCount(calculateLineCount(eventContainerRef));
      setProfessionalLineCount(calculateLineCount(professionalContainerRef));
      setEmergencyLineCount(calculateLineCount(emergencyContainerRef));
      setAdditionalLineCount(calculateLineCount(additionalContainerRef));
    };

    // Initial calculation
    updateLineCounts();

    // Set up ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver((entries) => {
      console.log("ResizeObserver: Detected resize", entries.length, "entries");
      debouncedUpdateLineCounts();
    });

    // Set up MutationObserver to catch DOM content changes
    const mutationObserver = new MutationObserver((mutations) => {
      console.log(
        "MutationObserver: Detected DOM changes",
        mutations.length,
        "mutations"
      );
      debouncedUpdateLineCounts();
    });

    const refs = [
      personalContainerRef,
      contactContainerRef,
      eventContainerRef,
      professionalContainerRef,
      emergencyContainerRef,
      additionalContainerRef,
    ];

    refs.forEach((ref) => {
      if (ref.current) {
        resizeObserver.observe(ref.current);
        // Observe child changes as well
        mutationObserver.observe(ref.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class", "style"],
        });
      }
    });

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [calculateLineCount, debouncedUpdateLineCounts]);

  // Update line counts when form content changes (with more comprehensive watching)
  useEffect(() => {
    console.log("Form change detected:", {
      attendeeType,
      gender,
      interestAreas,
      attendingDays,
    });

    // Immediate update
    debouncedUpdateLineCounts();

    // Additional delayed update to catch any async DOM changes
    const timeoutId = setTimeout(() => {
      console.log("Form change: Delayed update triggered");
      debouncedUpdateLineCounts();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [
    attendeeType,
    gender,
    interestAreas,
    attendingDays,
    debouncedUpdateLineCounts,
  ]);

  // Cleanup debounced timeout on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
      }
    };
  }, []);

  // Trigger validation when attendee type changes to clear/show professional field errors
  useEffect(() => {
    if (attendeeType) {
      form.trigger(["jobTitle", "companyName", "industry"]);
    }
  }, [attendeeType, form]);

  // Function to scroll to first error field
  const scrollToFirstError = useCallback(() => {
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);

    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0];
      let targetElement: Element | null = null;

      // Special handling for specific field types
      if (firstErrorField === "faceScannedUrl") {
        // For face capture, look for the face capture component or card
        targetElement =
          document.querySelector("[data-field='faceScannedUrl']") ||
          document.querySelector(".face-capture-component") ||
          document.querySelector("canvas") ||
          document.querySelector("video");
      } else {
        // Find the input element by name attribute
        targetElement = document.querySelector(`[name="${firstErrorField}"]`);
      }

      // If still not found, try to find by label text or data attributes
      if (!targetElement) {
        const fieldLabels = document.querySelectorAll("label");
        for (const label of fieldLabels) {
          if (
            label.textContent
              ?.toLowerCase()
              .includes(firstErrorField.toLowerCase()) ||
            label.getAttribute("for") === firstErrorField
          ) {
            targetElement = label;
            break;
          }
        }
      }

      // If still not found, look for FormMessage with error
      if (!targetElement) {
        const errorMessages = document.querySelectorAll(".text-destructive");
        if (errorMessages.length > 0) {
          targetElement = errorMessages[0];
        }
      }

      if (targetElement) {
        // Scroll to the element
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        // Focus the input if it's focusable and not a special component
        if (
          firstErrorField !== "faceScannedUrl" &&
          typeof (targetElement as HTMLElement).focus === "function"
        ) {
          setTimeout(() => (targetElement as HTMLElement).focus(), 300);
        }

        // Show toast with error message
        const errorMessage =
          errors[firstErrorField as keyof typeof errors]?.message;
        const friendlyFieldName =
          firstErrorField === "faceScannedUrl"
            ? "Face Capture"
            : firstErrorField
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());

        toast.error("Please check required fields", {
          description: `${friendlyFieldName}: ${
            errorMessage || "This field is required"
          }`,
          duration: 4000,
        });
      } else {
        // Ultimate fallback
        console.warn(`Could not find element for field: ${firstErrorField}`);
        toast.error("Please check required fields", {
          description:
            "Some fields need your attention. Please review the form.",
          duration: 4000,
        });
      }
    }
  }, [form.formState.errors]);

  const onSubmit = async (values: RegistrationFormData) => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    // Prevent submission if email exists
    if (emailCheck?.exists) {
      form.setError("email", {
        type: "manual",
        message: "Email already exists. Please use a different email.",
      });
      setTimeout(scrollToFirstError, 100);
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Starting registration submission...");
      const result = await registrationMutation.mutateAsync(values);

      if (result.success) {
        console.log("Registration successful!");

        // Store registration data for success dialog
        setRegistrationData({
          userId: result.data?.userId || "",
          visitorId: result.data?.visitorId || "",
        });

        // Show success toast
        toast.success("🎉 Registration Complete!", {
          description:
            "Your BEACON 2025 registration has been submitted successfully!",
          duration: 5000,
        });

        // Show success dialog
        setShowSuccessDialog(true);

        form.reset();
        clearFormData(); // Clear form draft store

        // Reset the submission state after successful registration
        setIsSubmitting(false);
      } else {
        console.log("Registration failed:", result.message);
        // Handle validation errors from server
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error) => {
            if (error.path && error.path.length > 0) {
              form.setError(error.path[0] as keyof RegistrationFormData, {
                type: "server",
                message: error.message,
              });
            }
          });
          // Scroll to first error after server validation
          setTimeout(scrollToFirstError, 100);
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Registration submission error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-300/20 dark:bg-c1">
      <div className="container mx-auto lg:p-4 p-2 max-w-5xl flex-1 flex flex-col gap-6 z-10">
        <div className="relative w-fit h-fit rounded-lg overflow-hidden group">
          <div className="z-10 group-hover:bg-black/30 duration-300 w-full h-full absolute"></div>
          <img
            src="/images/beacon-reg.png"
            className=" object-contain"
            alt=""
          />
          <div className="w-fit h-fit absolute bottom-4 right-4 z-20">
            <ModeToggle />
          </div>
        </div>
        <Card className="relative flex-1 flex flex-col h-full lg:p-12 p-2 dark:bg-white/20">
          <CardHeader className="shrink-0 p-0">
            <CardTitle className="text-2xl uppercase">
              BEACON 2025 Visitor Registration
            </CardTitle>
            <div className="w-24 max-w-24 border-c1 border-2 rounded-full h-1 bg-c1"></div>
            <CardDescription className="">
              <div className="text-accent-foreground">
                <p className="font-semibold">
                  Official Registration Form – Conference | Philippine Ships &
                  Boats In-Water Show | Blue Runway Fashion Show
                </p>
                <p>
                  September 29 – October 1, 2025 | SMX Convention Center, MOA
                  Complex, Pasay City
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
            <div className="mb-4 shrink-0">
              <DraftManagerVisitor />
            </div>
            <div className="flex-1 overflow-y-auto">
              <Form {...form}>
                <div className="relative lg:pr-0 pr-1">
                  {isSubmitting && (
                    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm font-medium">
                          Submitting Registration...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Please do not close this window
                        </p>
                      </div>
                    </div>
                  )}
                  <form
                    onSubmit={form.handleSubmit(onSubmit, (errors) => {
                      console.log("Form validation errors:", errors);
                      setTimeout(scrollToFirstError, 100);
                    })}
                  >
                    {/* Personal Information */}
                    <div
                      ref={personalContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:account"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: personalLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2 border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Personal Information
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <UserDetails form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div
                      ref={contactContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:email"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: contactLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2 border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Contact Information
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <UserAccounts form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Event Preferences */}
                    <div
                      ref={eventContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:calendar-multiple"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: eventLineCount }).map((_, i) => (
                          <span
                            key={i}
                            className="border-l-2 border-c1 h-2"
                          ></span>
                        ))}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Event Preferences
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <EventPreferences form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Professional Information - Only show for non-students */}
                    {attendeeType && attendeeType !== "STUDENT_ACADEMIC" && (
                      <div
                        ref={professionalContainerRef}
                        className="min-h-24 flex flex-row lg:gap-4"
                      >
                        <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                          <Icon
                            className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                            icon="mdi:briefcase"
                            width="24"
                            height="24"
                          />
                          {Array.from({ length: professionalLineCount }).map(
                            (_, i) => (
                              <span
                                key={i}
                                className="border-l-2 border-c1 h-2"
                              ></span>
                            )
                          )}
                        </div>
                        <div className="flex-1 flex flex-col lg:mt-3">
                          <h1 className="text-lg font-semibold">
                            Professional Information
                          </h1>
                          <div className="lg:ml-4 py-4 h-fit">
                            <ProfessionalInfo form={form} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emergency & Safety */}
                    <div
                      ref={emergencyContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:shield-check"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: emergencyLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2 border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Emergency & Safety
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <EmergencySafety form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div
                      ref={additionalContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:information"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: additionalLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2 border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Additional Information
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <AdditionalInfo form={form} />
                        </div>
                      </div>
                    </div>
                    <div
                      ref={submitContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="line-md:downloading-loop"
                          width="24"
                          height="24"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 ">
                      <Button
                        type="submit"
                        className="w-full cursor-pointer"
                        size="lg"
                        disabled={
                          isSubmitting ||
                          registrationMutation.isPending ||
                          emailCheck?.exists
                        }
                      >
                        {isSubmitting || registrationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : emailCheck?.exists ? (
                          "Email Already Exists - Cannot Submit"
                        ) : (
                          "Complete Registration"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* <RegistrationProgress form={form} /> */}

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Registration Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              🎉 Welcome to BEACON 2025! Your registration has been completed
              successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="text-center space-y-3 px-6 pb-2">
            <div className="text-sm text-muted-foreground">
              You will receive a confirmation email shortly with your
              registration details and event information.
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false);
                resetVisitorStore(); // Reset all Zustand state
                // Optionally redirect to a thank you page or home
                window.location.href = "/https://www.thebeaconexpo.com/";
              }}
              className="w-full dark:text-accent-foreground bg-green-600 hover:bg-green-700"
            >
              Continue to Homepage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
