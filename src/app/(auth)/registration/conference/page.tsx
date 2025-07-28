"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ShipWheel } from "lucide-react";
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
  ConferenceRegistrationFormData,
  conferenceRegistrationSchema,
  defaultConferenceRegistrationValues,
} from "@/types/conference/registration";
import { useConferenceRegistrationMutation } from "@/hooks/tanstasck-query/useConferenceRegistrationMutation";
import { useConferenceRegistrationStore } from "@/hooks/standard-hooks/conference/useConferenceRegistrationStore";
import { useEmailValidation } from "@/hooks/tanstasck-query/useEmailValidation";

// Import all conference components (keeping the existing ones)
import MaritimeMembership from "./conference-components/MaritimeMembership";
import EventSelection from "./conference-components/EventSelection";
import PersonalInformation from "./conference-components/PersonalInformation";
import ContactDetails from "./conference-components/ContactDetails";
import ProfessionalInformation from "./conference-components/ProfessionalInformation";
import InterestsAndPreferences from "./conference-components/InterestsAndPreferences";
import PaymentDetails from "./conference-components/PaymentDetails";
import ConsentAndConfirmation from "./conference-components/ConsentAndConfirmation";
import { RegistrationProgress } from "./components/RegistrationProgress";
import { DraftManager } from "./components/DraftManager";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import { ModeToggle } from "@/components/reuseable/page-components/ModeToggle";
import Link from "next/link";

interface ConferenceRegistrationState {
  isSubmitting: boolean;
  showSuccessDialog: boolean;
  registrationData: {
    conferenceId: string;
    userId: string;
    requiresPayment: boolean;
    totalAmount: number;
  } | null;
}

export default function ConferenceRegistrationSinglePage() {
  const { clearFormData, requiresPayment, tmlCodeValidationState } =
    useConferenceRegistrationStore();

  const { mutate: registerForConference, isPending } =
    useConferenceRegistrationMutation();

  // Refs for measuring container heights
  const maritimeContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const eventContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const personalContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const contactContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const professionalContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const interestsContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const paymentContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const consentContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const submitContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // State for dynamic vertical line counts
  const [maritimeLineCount, setMaritimeLineCount] = useState(6);
  const [eventLineCount, setEventLineCount] = useState(6);
  const [personalLineCount, setPersonalLineCount] = useState(6);
  const [contactLineCount, setContactLineCount] = useState(6);
  const [professionalLineCount, setProfessionalLineCount] = useState(6);
  const [interestsLineCount, setInterestsLineCount] = useState(6);
  const [paymentLineCount, setPaymentLineCount] = useState(6);
  const [consentLineCount, setConsentLineCount] = useState(6);
  const [submitLineCount, setSubmitLineCount] = useState(6);

  // Local state for single page registration
  const [state, setState] = React.useState<ConferenceRegistrationState>({
    isSubmitting: false,
    showSuccessDialog: false,
    registrationData: null,
  });

  const form = useForm<ConferenceRegistrationFormData>({
    resolver: zodResolver(conferenceRegistrationSchema) as any,
    defaultValues: defaultConferenceRegistrationValues,
    mode: "onChange",
  });

  const email = form.watch("email");
  const isMaritimeLeagueMember = form.watch("isMaritimeLeagueMember");
  const { data: emailCheck } = useEmailValidation(email);

  // Watch additional form fields that can cause dynamic height changes
  const gender = form.watch("gender");
  const selectedEventIds = form.watch("selectedEventIds");
  const paymentMode = form.watch("paymentMode");
  const tmlMemberCode = form.watch("tmlMemberCode");

  // Function to calculate number of vertical lines based on content container height
  const calculateLineCount = useCallback(
    (containerRef: React.RefObject<HTMLDivElement>) => {
      if (!containerRef.current) {
        console.log("calculateLineCount: No container ref");
        return 6; // Default fallback
      }

      // Find the specific content container with the h-fit  classes
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
        const maritimeCount = calculateLineCount(maritimeContainerRef);
        const eventCount = calculateLineCount(eventContainerRef);
        const personalCount = calculateLineCount(personalContainerRef);
        const contactCount = calculateLineCount(contactContainerRef);
        const professionalCount = calculateLineCount(professionalContainerRef);
        const interestsCount = calculateLineCount(interestsContainerRef);
        const paymentCount = calculateLineCount(paymentContainerRef);
        const consentCount = calculateLineCount(consentContainerRef);
        const submitCount = calculateLineCount(submitContainerRef);

        setMaritimeLineCount(maritimeCount);
        setEventLineCount(eventCount);
        setPersonalLineCount(personalCount);
        setContactLineCount(contactCount);
        setProfessionalLineCount(professionalCount);
        setInterestsLineCount(interestsCount);
        setPaymentLineCount(paymentCount);
        setConsentLineCount(consentCount);
        setSubmitLineCount(submitCount);

        console.log("debouncedUpdateLineCounts: Line counts updated", {
          maritime: maritimeCount,
          event: eventCount,
          personal: personalCount,
        });
      });
    }, 150);
  }, [calculateLineCount]);

  // Update line counts when containers resize
  useEffect(() => {
    const updateLineCounts = () => {
      setMaritimeLineCount(calculateLineCount(maritimeContainerRef));
      setEventLineCount(calculateLineCount(eventContainerRef));
      setPersonalLineCount(calculateLineCount(personalContainerRef));
      setContactLineCount(calculateLineCount(contactContainerRef));
      setProfessionalLineCount(calculateLineCount(professionalContainerRef));
      setInterestsLineCount(calculateLineCount(interestsContainerRef));
      setPaymentLineCount(calculateLineCount(paymentContainerRef));
      setConsentLineCount(calculateLineCount(consentContainerRef));
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
      maritimeContainerRef,
      eventContainerRef,
      personalContainerRef,
      contactContainerRef,
      professionalContainerRef,
      interestsContainerRef,
      paymentContainerRef,
      consentContainerRef,
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
      isMaritimeLeagueMember,
      gender,
      selectedEventIds,
      paymentMode,
      tmlMemberCode,
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
    isMaritimeLeagueMember,
    gender,
    selectedEventIds,
    paymentMode,
    tmlMemberCode,
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

  // Trigger validation when maritime league membership changes
  useEffect(() => {
    if (isMaritimeLeagueMember) {
      form.trigger(["tmlMemberCode"]);
    }
  }, [isMaritimeLeagueMember, form]);

  // Function to scroll to first error field
  const scrollToFirstError = useCallback(() => {
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);

    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0];

      // Find the input element by name attribute
      const inputElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );

      if (inputElement) {
        // Scroll to the element
        inputElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        // Focus the input if it's focusable
        if (typeof (inputElement as HTMLElement).focus === "function") {
          setTimeout(() => (inputElement as HTMLElement).focus(), 300);
        }

        // Show toast with error message
        const errorMessage =
          errors[firstErrorField as keyof typeof errors]?.message;
        toast.error("Please check required fields", {
          description: `${errorMessage || `${firstErrorField} is required`}`,
          duration: 4000,
        });
      } else {
        // Fallback: look for error message elements
        const errorMessage = document.querySelector(".text-destructive");
        if (errorMessage) {
          errorMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });

          toast.error("Please check required fields", {
            description: "Some fields need your attention.",
            duration: 4000,
          });
        }
      }
    }
  }, [form.formState.errors]);

  const onSubmit = async (values: ConferenceRegistrationFormData) => {
    // Prevent multiple submissions
    if (state.isSubmitting || isPending) return;

    // Prevent submission if email exists
    if (emailCheck?.exists) {
      form.setError("email", {
        type: "manual",
        message: "Email already exists. Please use a different email.",
      });
      setTimeout(scrollToFirstError, 100);
      return;
    }

    // Prevent submission if TML code is required but invalid
    if (tmlCodeValidationState.isRequired && !tmlCodeValidationState.isValid) {
      form.setError("tmlMemberCode", {
        type: "manual",
        message:
          "Please enter a valid TML member code or change your membership selection.",
      });
      toast.error("Invalid TML Member Code", {
        description:
          "Please enter a valid TML member code to proceed, or select a different membership option.",
        duration: 5000,
      });
      setTimeout(scrollToFirstError, 100);
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      console.log("Starting conference registration submission...");

      registerForConference(values, {
        onSuccess: (result) => {
          console.log("Conference registration successful!", result);

          // Store registration data for success dialog
          setState((prev) => ({
            ...prev,
            registrationData: result.data,
            showSuccessDialog: true,
            isSubmitting: false,
          }));

          // Show success toast
          toast.success("🎉 Conference Registration Complete!", {
            description: requiresPayment
              ? "Your registration and payment receipt have been submitted successfully!"
              : "Your registration has been submitted successfully as a TML member!",
            duration: 5000,
          });

          form.reset();
          clearFormData();
        },
        onError: (error) => {
          console.error("Conference registration failed:", error);

          // Parse error message for better user feedback
          let errorMessage = "An unexpected error occurred. Please try again.";
          if (error.message.includes("already has a conference registration")) {
            errorMessage = "You have already registered for this conference.";
          } else if (error.message.includes("Validation failed")) {
            errorMessage = "Please check your form data and try again.";
          } else if (error.message.includes("payment")) {
            errorMessage =
              "There was an issue processing your payment information.";
          }

          toast.error("Conference Registration Error", {
            description: errorMessage,
            duration: 5000,
          });

          setTimeout(scrollToFirstError, 100);
          setState((prev) => ({ ...prev, isSubmitting: false }));
        },
      });
    } catch (error) {
      console.error("Conference registration submission error:", error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
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
        <Card className="relative dark:bg-white/20 flex-1 flex flex-col h-full lg:p-12 p-2">
          <CardHeader className="shrink-0 p-0">
            <CardTitle className="text-2xl uppercase">
              BEACON EXPO & Conference 2025
            </CardTitle>
            <Separator className="w-24 max-w-24 border-c1 border-2 rounded-full" />
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
          <CardContent className="flex-1 overflow-hidden flex flex-col  p-0">
            <div className="mb-4 shrink-0">
              <DraftManager />
            </div>
            <div className="flex-1 overflow-y-auto pb-32">
              <Form {...form}>
                <div className="relative lg:p-2">
                  {(state.isSubmitting || isPending) && (
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
                    <Separator className="max-w-sm mx-auto border-c1 border rounded-full mt-6 mb-12" />
                    <div
                      ref={maritimeContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:ship-wheel"
                          width="24"
                          height="24"
                        />

                        {Array.from({ length: maritimeLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2  border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Maritime League Membership
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <MaritimeMembership form={form} />
                        </div>
                      </div>
                    </div>

                    <div
                      ref={eventContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="fa6-solid:users"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: eventLineCount }).map((_, i) => (
                          <span
                            key={i}
                            className="border-l-2  border-c1 h-2"
                          ></span>
                        ))}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Event Date Selection
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <EventSelection form={form} />
                        </div>
                      </div>
                    </div>

                    <div
                      ref={personalContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="si:warning-fill"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: personalLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2  border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Personal Information
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <PersonalInformation form={form} />
                        </div>
                      </div>
                    </div>

                    <div
                      ref={contactContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:telephone"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: contactLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2  border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Contact Information
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <ContactDetails form={form} />
                        </div>
                      </div>
                    </div>

                    <div
                      ref={professionalContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:tie"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: professionalLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2  border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Professional Information
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <ProfessionalInformation form={form} />
                        </div>
                      </div>
                    </div>

                    <div
                      ref={interestsContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="bx:run"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: interestsLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2  border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Areas of Interests & Preferences
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <InterestsAndPreferences form={form} />
                        </div>
                      </div>
                    </div>

                    <div
                      ref={paymentContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="ion:wallet-outline"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: paymentLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2  border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Payment Details
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <PaymentDetails form={form} />
                        </div>
                      </div>
                    </div>

                    <div
                      ref={consentContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="qlementine-icons:certified-filled-16"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: consentLineCount }).map(
                          (_, i) => (
                            <span
                              key={i}
                              className="border-l-2  border-c1 h-2"
                            ></span>
                          )
                        )}
                      </div>
                      <div className="flex-1 flex flex-col lg:mt-3">
                        <h1 className="text-lg font-semibold">
                          Consent & Confirmation
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit ">
                          <ConsentAndConfirmation form={form} />
                        </div>
                      </div>
                    </div>
                    <div
                      ref={submitContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1 ">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 lg:h-12 lg:w-12 h-6 w-6"
                          icon="line-md:downloading-loop"
                          width="24"
                          height="24"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pb-8">
                      <Button
                        type="submit"
                        className="w-full cursor-pointer"
                        size="lg"
                        disabled={
                          state.isSubmitting ||
                          isPending ||
                          emailCheck?.exists ||
                          (tmlCodeValidationState.isRequired &&
                            !tmlCodeValidationState.isValid)
                        }
                      >
                        {state.isSubmitting || isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {requiresPayment
                              ? "Processing Payment..."
                              : "Registering..."}
                          </>
                        ) : emailCheck?.exists ? (
                          "Email Already Exists - Cannot Submit"
                        ) : tmlCodeValidationState.isRequired &&
                          !tmlCodeValidationState.isValid ? (
                          "Enter Valid TML Code to Continue"
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

      {/* Success Dialog - Only for TML members (no payment required) */}
      <AlertDialog
        open={state.showSuccessDialog}
        onOpenChange={(open) =>
          setState((prev) => ({ ...prev, showSuccessDialog: open }))
        }
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Registration Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              🎉 Welcome to BEACON 2025 Conference! Your registration has been{" "}
              {requiresPayment
                ? "submitted successfully."
                : "completed successfully."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="text-center space-y-3 px-6 pb-2">
            <div className="text-sm text-muted-foreground">
              {requiresPayment
                ? "Your payment receipt has been uploaded and is under review. You will receive a confirmation email once your payment is verified."
                : "As a TML member, your registration is complete with no payment required. You will receive a confirmation email shortly."}
            </div>

            <div className="text-xs text-muted-foreground">
              Save this information for your records.
            </div>
          </div>

          <AlertDialogFooter>
            <Link href={"/https://www.thebeaconexpo.com/"}>
              <AlertDialogAction className="w-full bg-green-600 hover:bg-green-700 dark:text-accent-foreground">
                Continue to Homepage
              </AlertDialogAction>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
