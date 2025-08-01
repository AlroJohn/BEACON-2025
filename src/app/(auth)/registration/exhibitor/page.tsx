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
  exhibitorRegistrationSchema,
  ExhibitorRegistrationFormData,
  defaultExhibitorRegistrationValues,
} from "@/types/exhibitor/registration";
import { useExhibitorRegistrationMutation } from "@/hooks/tanstasck-query/useExhibitorRegistrationMutation";
import { useEmailValidation } from "@/hooks/tanstasck-query/useEmailValidation";

// Import all components
import { CompanyInformation } from "./exhibitor-components/CompanyInformation";
import { PersonalInformation } from "./exhibitor-components/PersonalInformation";
import { ContactInformation } from "./exhibitor-components/ContactInformation";
import { ExhibitionPackage } from "./exhibitor-components/ExhibitionPackage";
import { LogisticsMarketing } from "./exhibitor-components/LogisticsMarketing";
import { ObjectivesGoals } from "./exhibitor-components/ObjectivesGoals";
import { ConfirmationNextSteps } from "./exhibitor-components/ConfirmationNextSteps";
import { Icon } from "@iconify/react";
import { ModeToggle } from "@/components/reuseable/page-components/ModeToggle";

export default function ExhibitorRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registrationData, setRegistrationData] = useState<{
    userId: string;
    exhibitorId: string;
  } | null>(null);

  // Refs for measuring container heights
  const companyContainerRef = useRef<HTMLDivElement>(null);
  const personalContainerRef = useRef<HTMLDivElement>(null);
  const contactContainerRef = useRef<HTMLDivElement>(null);
  const exhibitionContainerRef = useRef<HTMLDivElement>(null);
  const logisticsContainerRef = useRef<HTMLDivElement>(null);
  const objectivesContainerRef = useRef<HTMLDivElement>(null);
  const confirmationContainerRef = useRef<HTMLDivElement>(null);
  const submitContainerRef = useRef<HTMLDivElement>(null);

  // State for dynamic vertical line counts
  const [companyLineCount, setCompanyLineCount] = useState(6);
  const [personalLineCount, setPersonalLineCount] = useState(6);
  const [contactLineCount, setContactLineCount] = useState(6);
  const [exhibitionLineCount, setExhibitionLineCount] = useState(6);
  const [logisticsLineCount, setLogisticsLineCount] = useState(6);
  const [objectivesLineCount, setObjectivesLineCount] = useState(6);
  const [confirmationLineCount, setConfirmationLineCount] = useState(6);

  const exhibitorRegistrationMutation = useExhibitorRegistrationMutation();

  const form = useForm<ExhibitorRegistrationFormData>({
    resolver: zodResolver(exhibitorRegistrationSchema),
    defaultValues: defaultExhibitorRegistrationValues,
    mode: "onChange",
  });

  const email = form.watch("email");
  const gender = form.watch("gender");
  const industrySector = form.watch("industrySector");
  const participationTypes = form.watch("participationTypes");
  const goals = form.watch("goals");
  const { data: emailCheck } = useEmailValidation(email, "exhibitor");

  // Function to calculate number of vertical lines based on content container height
  const calculateLineCount = useCallback(
    (containerRef: React.RefObject<HTMLDivElement | null>) => {
      if (!containerRef.current) {
        return 6; // Default fallback
      }

      const contentContainer = containerRef.current.querySelector(
        ".h-fit"
      ) as HTMLElement;
      if (!contentContainer) {
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

      return lineCount;
    },
    []
  );

  // Debounced update function to prevent excessive updates
  const debouncedUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedUpdateLineCounts = useCallback(() => {
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }

    debouncedUpdateRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        const companyCount = calculateLineCount(companyContainerRef);
        const personalCount = calculateLineCount(personalContainerRef);
        const contactCount = calculateLineCount(contactContainerRef);
        const exhibitionCount = calculateLineCount(exhibitionContainerRef);
        const logisticsCount = calculateLineCount(logisticsContainerRef);
        const objectivesCount = calculateLineCount(objectivesContainerRef);
        const confirmationCount = calculateLineCount(confirmationContainerRef);

        setCompanyLineCount(companyCount);
        setPersonalLineCount(personalCount);
        setContactLineCount(contactCount);
        setExhibitionLineCount(exhibitionCount);
        setLogisticsLineCount(logisticsCount);
        setObjectivesLineCount(objectivesCount);
        setConfirmationLineCount(confirmationCount);
      });
    }, 150);
  }, [calculateLineCount]);

  // Update line counts when containers resize
  useEffect(() => {
    const updateLineCounts = () => {
      setCompanyLineCount(calculateLineCount(companyContainerRef));
      setPersonalLineCount(calculateLineCount(personalContainerRef));
      setContactLineCount(calculateLineCount(contactContainerRef));
      setExhibitionLineCount(calculateLineCount(exhibitionContainerRef));
      setLogisticsLineCount(calculateLineCount(logisticsContainerRef));
      setObjectivesLineCount(calculateLineCount(objectivesContainerRef));
      setConfirmationLineCount(calculateLineCount(confirmationContainerRef));
    };

    // Initial calculation
    updateLineCounts();

    // Set up ResizeObserver for dynamic updates
    const resizeObserver = new ResizeObserver((entries) => {
      debouncedUpdateLineCounts();
    });

    // Set up MutationObserver to catch DOM content changes
    const mutationObserver = new MutationObserver((mutations) => {
      debouncedUpdateLineCounts();
    });

    const refs = [
      companyContainerRef,
      personalContainerRef,
      contactContainerRef,
      exhibitionContainerRef,
      logisticsContainerRef,
      objectivesContainerRef,
      confirmationContainerRef,
    ];

    refs.forEach((ref) => {
      if (ref.current) {
        resizeObserver.observe(ref.current);
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

  // Update line counts when form content changes
  useEffect(() => {
    debouncedUpdateLineCounts();

    const timeoutId = setTimeout(() => {
      debouncedUpdateLineCounts();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [
    gender,
    industrySector,
    participationTypes,
    goals,
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

  // Function to scroll to first error field
  const scrollToFirstError = useCallback(() => {
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);

    if (errorFields.length > 0) {
      const firstErrorField = errorFields[0];
      let targetElement: Element | null = null;

      // Special handling for specific field types
      if (firstErrorField === "faceScannedUrl") {
        targetElement =
          document.querySelector("[data-field='faceScannedUrl']") ||
          document.querySelector(".face-capture-component") ||
          document.querySelector("canvas") ||
          document.querySelector("video");
      } else {
        targetElement = document.querySelector(`[name="${firstErrorField}"]`);
      }

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

      if (!targetElement) {
        const errorMessages = document.querySelectorAll(".text-destructive");
        if (errorMessages.length > 0) {
          targetElement = errorMessages[0];
        }
      }

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        if (
          firstErrorField !== "faceScannedUrl" &&
          typeof (targetElement as HTMLElement).focus === "function"
        ) {
          setTimeout(() => (targetElement as HTMLElement).focus(), 300);
        }

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
        console.warn(`Could not find element for field: ${firstErrorField}`);
        toast.error("Please check required fields", {
          description:
            "Some fields need your attention. Please review the form.",
          duration: 4000,
        });
      }
    }
  }, [form.formState.errors]);

  const onSubmit = async (values: ExhibitorRegistrationFormData) => {
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
      console.log("Starting exhibitor registration submission...");
      const result = await exhibitorRegistrationMutation.mutateAsync({
        ...values,
        // Files will be handled by the mutation hook
      });

      if (result.success) {
        console.log("Exhibitor registration successful!");

        // Store registration data for success dialog
        setRegistrationData({
          userId: result.data?.userId || "",
          exhibitorId: result.data?.exhibitorId || "",
        });

        // Show success toast
        toast.success("🎉 Registration Complete!", {
          description:
            "Your BEACON 2025 exhibitor registration has been submitted successfully!",
          duration: 5000,
        });

        // Show success dialog
        setShowSuccessDialog(true);

        form.reset();

        // Reset the submission state after successful registration
        setIsSubmitting(false);
      } else {
        console.log("Exhibitor registration failed:", result.message);
        // Handle validation errors from server
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error: any) => {
            if (error.path && error.path.length > 0) {
              form.setError(
                error.path[0] as keyof ExhibitorRegistrationFormData,
                {
                  type: "server",
                  message: error.message,
                }
              );
            }
          });
          // Scroll to first error after server validation
          setTimeout(scrollToFirstError, 100);
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Exhibitor registration submission error:", error);
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
              BEACON 2025 Exhibitor Registration
            </CardTitle>
            <div className="w-24 max-w-24 border-c1 border-2 rounded-full h-1 bg-c1"></div>
            <CardDescription className="">
              <div className="text-accent-foreground">
                <p className="font-semibold">
                  Official Exhibitor Registration Form – Showcase Your Products
                  & Services
                </p>
                <p>
                  September 29 – October 1, 2025 | SMX Convention Center, MOA
                  Complex, Pasay City
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
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
                    {/* Company Information */}
                    <div
                      ref={companyContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:office-building"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: companyLineCount }).map(
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
                          Company Information
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <CompanyInformation form={form} />
                        </div>
                      </div>
                    </div>

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
                          <PersonalInformation form={form} />
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
                          <ContactInformation form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Exhibition Package & Preferences */}
                    <div
                      ref={exhibitionContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:store"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: exhibitionLineCount }).map(
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
                          Exhibition Package & Preferences
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <ExhibitionPackage form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Logistics & Marketing */}
                    <div
                      ref={logisticsContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:truck-delivery"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: logisticsLineCount }).map(
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
                          Logistics & Marketing Coordination
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <LogisticsMarketing form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Company Objectives & Goals */}
                    <div
                      ref={objectivesContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:target"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: objectivesLineCount }).map(
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
                          Company Objectives & Goals
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <ObjectivesGoals form={form} />
                        </div>
                      </div>
                    </div>

                    {/* Confirmation & Next Steps */}
                    <div
                      ref={confirmationContainerRef}
                      className="min-h-24 flex flex-row lg:gap-4"
                    >
                      <div className="flex-none flex flex-col items-center justify-start space-y-1 pr-2 pb-1">
                        <Icon
                          className="rounded-full bg-c1/30 text-c1 dark:text-white dark:border-white border-2 border-c1 lg:p-2 p-1 lg:h-12 lg:w-12 h-6 w-6"
                          icon="mdi:check-circle"
                          width="24"
                          height="24"
                        />
                        {Array.from({ length: confirmationLineCount }).map(
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
                          Confirmation & Next Steps
                        </h1>
                        <div className="lg:ml-4 py-4 h-fit">
                          <ConfirmationNextSteps form={form} />
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
                          exhibitorRegistrationMutation.isPending ||
                          emailCheck?.exists
                        }
                      >
                        {isSubmitting ||
                        exhibitorRegistrationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : emailCheck?.exists ? (
                          "Email Already Exists - Cannot Submit"
                        ) : (
                          "Complete Exhibitor Registration"
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

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="md:max-w-md max-w-[95dvw]">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Exhibitor Registration Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              🎉 Welcome to BEACON 2025! Your exhibitor registration has been
              completed successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="text-center space-y-3 px-6 pb-2">
            <div className="text-sm text-muted-foreground">
              You will receive a confirmation email shortly with your
              registration details and booth information.
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccessDialog(false);
                // Optionally redirect to a thank you page or home
                window.location.href = "https://www.thebeaconexpo.com/";
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
