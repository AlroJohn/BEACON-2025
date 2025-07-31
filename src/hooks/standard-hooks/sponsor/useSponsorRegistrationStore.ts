import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SponsorRegistrationFormData, SponsorFormStep } from "@/types/sponsors/registration";

interface SponsorRegistrationStore {
  // Form data
  formData: Partial<SponsorRegistrationFormData>;
  setFormData: (data: Partial<SponsorRegistrationFormData>) => void;
  resetFormData: () => void;

  // Step management
  currentStep: SponsorFormStep;
  setCurrentStep: (step: SponsorFormStep) => void;
  
  // Progress tracking
  completedSteps: SponsorFormStep[];
  markStepCompleted: (step: SponsorFormStep) => void;
  isStepCompleted: (step: SponsorFormStep) => boolean;

  // Draft management
  isDraftSaved: boolean;
  setDraftSaved: (saved: boolean) => void;
  lastSavedAt: Date | null;
  setLastSavedAt: (date: Date) => void;

  // Submission state
  isSubmitting: boolean;
  setSubmitting: (submitting: boolean) => void;

  // File handling
  faceImageFile: string | null;
  setFaceImageFile: (file: string | null) => void;
  logoFile: File | null;
  setLogoFile: (file: File | null) => void;

  // Helper methods
  canNavigateToStep: (step: SponsorFormStep) => boolean;
  getNextStep: (currentStep: SponsorFormStep) => SponsorFormStep | null;
  getPreviousStep: (currentStep: SponsorFormStep) => SponsorFormStep | null;
}

const stepOrder: SponsorFormStep[] = [
  "company",
  "personal", 
  "contact",
  "interest",
  "activation",
  "budget",
  "review"
];

export const useSponsorRegistrationStore = create<SponsorRegistrationStore>()(
  persist(
    (set, get) => ({
      // Form data
      formData: {},
      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
          isDraftSaved: false,
        })),
      resetFormData: () =>
        set({
          formData: {},
          currentStep: "company",
          completedSteps: [],
          isDraftSaved: false,
          lastSavedAt: null,
          faceImageFile: null,
          logoFile: null,
        }),

      // Step management
      currentStep: "company",
      setCurrentStep: (step) => set({ currentStep: step }),

      // Progress tracking
      completedSteps: [],
      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
        })),
      isStepCompleted: (step) => get().completedSteps.includes(step),

      // Draft management
      isDraftSaved: false,
      setDraftSaved: (saved) => set({ isDraftSaved: saved }),
      lastSavedAt: null,
      setLastSavedAt: (date) => set({ lastSavedAt: date, isDraftSaved: true }),

      // Submission state
      isSubmitting: false,
      setSubmitting: (submitting) => set({ isSubmitting: submitting }),

      // File handling
      faceImageFile: null,
      setFaceImageFile: (file) => set({ faceImageFile: file }),
      logoFile: null,
      setLogoFile: (file) => set({ logoFile: file }),

      // Helper methods
      canNavigateToStep: (step) => {
        const state = get();
        const targetIndex = stepOrder.indexOf(step);
        const currentIndex = stepOrder.indexOf(state.currentStep);
        
        // Can always go backward
        if (targetIndex < currentIndex) return true;
        
        // Can go forward if all previous steps are completed
        for (let i = 0; i < targetIndex; i++) {
          if (!state.completedSteps.includes(stepOrder[i])) {
            return false;
          }
        }
        return true;
      },

      getNextStep: (currentStep) => {
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
          return null;
        }
        return stepOrder[currentIndex + 1];
      },

      getPreviousStep: (currentStep) => {
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex <= 0) {
          return null;
        }
        return stepOrder[currentIndex - 1];
      },
    }),
    {
      name: "sponsor-registration-store",
      // Only persist essential data, not file objects
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        isDraftSaved: state.isDraftSaved,
        lastSavedAt: state.lastSavedAt,
        faceImageFile: state.faceImageFile,
        // Don't persist File objects (logoFile)
      }),
    }
  )
);