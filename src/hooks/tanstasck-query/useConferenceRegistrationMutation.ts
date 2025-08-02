import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConferenceRegistrationFormData } from "@/types/conference/registration";

interface ConferenceRegistrationResponse {
  success: boolean;
  data: {
    conferenceId: string;
    userId: string;
    requiresPayment: boolean;
    totalAmount: number;
    paymentToken?: string;
    paymentTokenExpiry?: Date;
    // PayMongo integration fields
    paymongoCheckoutId?: string;
    paymongoCheckoutUrl?: string;
    paymentMethods?: string[];
  };
  message?: string;
  errors?: Array<{
    path: string[];
    message: string;
  }>;
}

interface ConferenceAPIError {
  error: string;
  details?: any[];
}

const registerForConference = async (data: ConferenceRegistrationFormData): Promise<ConferenceRegistrationResponse> => {
  console.log("Sending conference registration data:", data);

  // Determine payment requirements
  const requiresPayment = data.isMaritimeLeagueMember === 'NO' && data.totalPaymentAmount && data.totalPaymentAmount > 0;

  console.log("Payment decision logic:", {
    requiresPayment,
    paymentMode: data.paymentMode,
    totalAmount: data.totalPaymentAmount
  });

  // Create FormData to handle file upload
  const formData = new FormData();
  
  // Add all form fields to FormData
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'receiptImageUrl' && value instanceof File) {
      // Handle file upload
      formData.append('receiptFile', value);
    } else if (Array.isArray(value)) {
      // Handle arrays (selectedEventIds, interestAreas)
      formData.append(key, JSON.stringify(value));
    } else if (key === 'attendingDays' && typeof value === 'object' && value !== null) {
      // Handle attendingDays object - needs to be JSON stringified
      formData.append(key, JSON.stringify(value));
    } else if (key === 'detailedInterests' && typeof value === 'object' && value !== null) {
      // Handle detailedInterests object - needs to be JSON stringified
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      // Handle other values
      formData.append(key, String(value));
    }
  });

  console.log("Using endpoint: /api/conference");

  const response = await fetch("/api/conference", {
    method: "POST",
    body: formData, // No Content-Type header for FormData
  });

  console.log("Response status:", response.status);
  console.log("Response headers:", Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log("Raw response:", responseText);

  let responseData;
  try {
    responseData = JSON.parse(responseText);
    console.log("Parsed response data:", responseData);
  } catch (parseError) {
    console.error("Failed to parse JSON response:", parseError);
    console.error("Response was:", responseText);
    throw new Error(`Invalid JSON response from server. Status: ${response.status}`);
  }

  if (!response.ok) {
    const errorResponse = responseData as ConferenceAPIError & { message?: string; details?: any[] };
    console.error('API Error Response:', errorResponse);
    
    let errorMessage = errorResponse.error || "Conference registration failed";
    if (errorResponse.message) {
      errorMessage += `: ${errorResponse.message}`;
    }
    if (errorResponse.details) {
      console.error('Validation details:', errorResponse.details);
    }
    
    throw new Error(errorMessage);
  }

  return responseData;
};

export const useConferenceRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerForConference,
    onSuccess: (data) => {
      if (data.success) {
        // Success toast is handled in the component for better control
        // Invalidate and refetch any related queries
        queryClient.invalidateQueries({ queryKey: ['conferences'] });
        queryClient.invalidateQueries({ queryKey: ['conference-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['summary-of-payments'] });
      } else {
        toast.error("Conference Registration Failed", {
          description: data.message || "Please check your information and try again.",
        });
      }
    },
    onError: (error) => {
      console.error("Conference registration error:", error);
      
      // Parse error message for better user feedback
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.message.includes("already has a conference registration")) {
        errorMessage = "You have already registered for this conference.";
      } else if (error.message.includes("Validation failed")) {
        errorMessage = "Please check your form data and try again.";
      } else if (error.message.includes("payment")) {
        errorMessage = "There was an issue processing your payment information.";
      }

      toast.error("Conference Registration Error", {
        description: errorMessage,
      });
    },
  });
};

// Get conference registration by ID
const getConferenceRegistration = async (conferenceId: string): Promise<ConferenceRegistrationResponse['data']> => {
  const response = await fetch(`/api/conference?conferenceId=${conferenceId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch conference registration: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data[0]; // API returns array, we want first item
};

// Hook for fetching conference registration
export const useConferenceRegistrationQuery = (conferenceId: string) => {
  return useQuery({
    queryKey: ['conference-registration', conferenceId],
    queryFn: () => getConferenceRegistration(conferenceId),
    enabled: !!conferenceId,
  });
};

// Get conference registrations by user
const getConferenceRegistrationsByUser = async (userId: string): Promise<ConferenceRegistrationResponse['data'][]> => {
  const response = await fetch(`/api/conference?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user conference registrations: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
};

// Hook for fetching user's conference registrations
export const useUserConferenceRegistrationsQuery = (userId: string) => {
  return useQuery({
    queryKey: ['user-conference-registrations', userId],
    queryFn: () => getConferenceRegistrationsByUser(userId),
    enabled: !!userId,
  });
};

// Get conference registration by email
const getConferenceRegistrationByEmail = async (email: string): Promise<ConferenceRegistrationResponse['data'][]> => {
  const response = await fetch(`/api/conference?email=${encodeURIComponent(email)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch conference registration by email: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
};

// Hook for fetching conference registration by email
export const useConferenceRegistrationByEmailQuery = (email: string) => {
  return useQuery({
    queryKey: ['conference-registration-by-email', email],
    queryFn: () => getConferenceRegistrationByEmail(email),
    enabled: !!email,
  });
};

// Update conference registration
const updateConferenceRegistration = async (params: {
  conferenceId: string;
  data: Partial<ConferenceRegistrationFormData>;
}): Promise<ConferenceRegistrationResponse> => {
  const response = await fetch("/api/conference", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update conference registration: ${errorData.error}`);
  }

  return response.json();
};

// Hook for updating conference registration
export const useUpdateConferenceRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateConferenceRegistration,
    onSuccess: (data) => {
      toast.success("Conference registration updated successfully!");
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
      queryClient.invalidateQueries({ queryKey: ['conference-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['conference-registration', data.data.conferenceId] });
    },
    onError: (error) => {
      console.error("Update conference registration error:", error);
      toast.error("Failed to update conference registration", {
        description: error.message,
      });
    },
  });
};

// Delete conference registration
const deleteConferenceRegistration = async (conferenceId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/conference?conferenceId=${conferenceId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to delete conference registration: ${errorData.error}`);
  }

  return response.json();
};

// Hook for deleting conference registration
export const useDeleteConferenceRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConferenceRegistration,
    onSuccess: () => {
      toast.success("Conference registration deleted successfully!");
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
      queryClient.invalidateQueries({ queryKey: ['conference-registrations'] });
    },
    onError: (error) => {
      console.error("Delete conference registration error:", error);
      toast.error("Failed to delete conference registration", {
        description: error.message,
      });
    },
  });
};

// Export mutation keys for other hooks to use
export const CONFERENCE_REGISTRATION_MUTATION_KEY = ['register-conference'] as const;
export const UPDATE_CONFERENCE_REGISTRATION_MUTATION_KEY = ['update-conference-registration'] as const;
export const DELETE_CONFERENCE_REGISTRATION_MUTATION_KEY = ['delete-conference-registration'] as const;