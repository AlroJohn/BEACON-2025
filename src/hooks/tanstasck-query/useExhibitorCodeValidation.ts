import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/standard-hooks/useDebounce";
import { useState, useEffect } from "react";

interface CodeValidationResponse {
  success: boolean;
  message: string;
  data?: {
    code: string;
    isValid: boolean;
    benefits: string[];
  };
  error?: string;
  usedBy?: {
    name: string;
    email: string;
  };
}

interface CodeUsageUpdateData {
  code: string;
  userId: string;
}

// Validate Exhibitor member code
const validateExhibitorCode = async (code: string): Promise<CodeValidationResponse> => {
  const response = await fetch("/api/exhibitor-codes/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: code.trim() }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Return the error data as is for proper handling
    return data;
  }

  return data;
};

// Hook for validating Exhibitor member codes
export const useExhibitorCodeValidationMutation = () => {
  return useMutation({
    mutationFn: validateExhibitorCode,
    onError: (error) => {
      console.error("Exhibitor code validation error:", error);
    },
    // Don't show automatic toasts - let components handle the response
  });
};

// Mark exhibitor code as used by a user
const markExhibitorCodeAsUsed = async ({ code, userId }: CodeUsageUpdateData): Promise<CodeValidationResponse> => {
  const response = await fetch("/api/exhibitor-codes", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to mark exhibitor code as used');
  }

  return response.json();
};

// Hook for marking exhibitor code as used
export const useMarkExhibitorCodeAsUsedMutation = () => {
  return useMutation({
    mutationFn: markExhibitorCodeAsUsed,
    onSuccess: (data) => {
      toast.success("Exhibitor Member code verified and applied successfully!");
    },
    onError: (error) => {
      console.error("Exhibitor code usage update error:", error);
      toast.error("Failed to apply Exhibitor member code", {
        description: error.message,
      });
    },
  });
};

// Real-time exhibitor code validation hook with debouncing
export const useRealTimeExhibitorCodeValidation = (initialCode: string = "") => {
  const [code, setCode] = useState(initialCode);
  const [validationResult, setValidationResult] = useState<CodeValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const debouncedCode = useDebounce(code, 500); // 500ms delay
  const { mutateAsync: validateCode } = useExhibitorCodeValidationMutation();

  // Validate code when debounced value changes
  useEffect(() => {
    const validateCodeAsync = async () => {
      if (!debouncedCode.trim()) {
        setValidationResult(null);
        return;
      }

      if (debouncedCode.length < 3) {
        setValidationResult({
          success: false,
          message: "Code must be at least 3 characters long",
          error: "Code too short"
        });
        return;
      }

      setIsValidating(true);
      try {
        const result = await validateCode(debouncedCode);
        setValidationResult(result);
      } catch (error) {
        console.error("Validation error:", error);
        setValidationResult({
          success: false,
          message: "Error validating code",
          error: "Validation failed"
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateCodeAsync();
  }, [debouncedCode, validateCode]);

  const clearValidation = () => {
    setValidationResult(null);
    setCode("");
  };

  const isValid = validationResult?.success === true;
  const hasError = validationResult?.success === false;
  const isEmpty = !code.trim();

  return {
    code,
    setCode,
    validationResult,
    isValidating,
    isValid,
    hasError,
    isEmpty,
    clearValidation,
    // Computed states for UI
    showLoading: isValidating && debouncedCode.length >= 3,
    showSuccess: isValid,
    showError: hasError && !isEmpty,
    errorMessage: validationResult?.message || validationResult?.error,
    benefits: validationResult?.data?.benefits || [],
  };
};

// Helper hook for Exhibitor member benefits display
export const useExhibitorMemberBenefits = () => {
  const defaultBenefits = [
    'Early access to booth selection',
    'Exhibitor lounge access',
    'Discounted booth rates',
    'Priority marketing opportunities',
    'Extended setup/teardown periods'
  ];

  const getBenefitIcon = (benefit: string) => {
    if (benefit.includes('Early') || benefit.includes('early')) return '⏱️';
    if (benefit.includes('Discount') || benefit.includes('discount')) return '💰';
    if (benefit.includes('Priority') || benefit.includes('priority')) return '⭐';
    if (benefit.includes('lounge') || benefit.includes('Lounge')) return '🔑';
    if (benefit.includes('Extended') || benefit.includes('extended')) return '⏳';
    return '✅';
  };

  return {
    defaultBenefits,
    getBenefitIcon,
  };
};

// Export query keys
export const EXHIBITOR_CODE_VALIDATION_KEY = ['exhibitor-code-validation'] as const;