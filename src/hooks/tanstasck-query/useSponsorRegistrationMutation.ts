import { useMutation } from "@tanstack/react-query";
import { SponsorRegistrationFormData, SponsorRegistrationResponse } from "@/types/sponsors/registration";

const submitSponsorRegistration = async (
  data: SponsorRegistrationFormData & { logoFile?: File | null }
): Promise<SponsorRegistrationResponse> => {
  const formData = new FormData();

  // Add all form fields as strings
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'logoFile') {
      // Handle logo file separately
      if (value instanceof File) {
        formData.append('logoFile', value);
      }
    } else if (key === 'sponsorshipCategories' || key === 'targetAudience') {
      // Handle arrays by converting to JSON
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      // Handle all other fields as strings
      formData.append(key, String(value));
    }
  });

  const response = await fetch("/api/sponsorship", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      success: false, 
      error: "Network error", 
      message: "Failed to submit registration" 
    }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useSponsorRegistrationMutation = () => {
  return useMutation({
    mutationFn: submitSponsorRegistration,
    onSuccess: (data) => {
      console.log("Sponsor registration successful:", data);
    },
    onError: (error) => {
      console.error("Sponsor registration failed:", error);
    },
  });
};