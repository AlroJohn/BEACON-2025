import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/adminStore";
import { useSupabaseRealtime } from "@/providers/SupabaseRealtimeProvider";
import { supabase } from "@/lib/supabase";
import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRealtimeWithFallback } from "./useRealtimeWithFallback";

interface ConferenceData {
  id: string;
  createdAt: string;
  updatedAt: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName: string;
    suffix: string;
    preferredName: string;
    gender: string;
    genderOthers: string;
    ageBracket: string;
    nationality: string;
    faceScannedUrl: string;
  };
  contactInfo: {
    email: string;
    mobileNumber: string;
    landline: string;
    mailingAddress: string;
    status: string;
  };
  conferenceInfo: {
    isMaritimeLeagueMember: string;
    tmlMemberCode: string | null;
    jobTitle: string | null;
    companyName: string | null;
    industry: string | null;
    companyAddress: string | null;
    companyWebsite: string | null;
    interestAreas: string[];
    otherInterests: string | null;
    receiveEventInvites: boolean;
    emailCertificate: boolean;
    photoVideoConsent: boolean;
    dataUsageConsent: boolean;
  };
  paymentInfo: {
    totalAmount: number | null;
    referenceNumber: string | null;
    receiptImageUrl: string | null;
    notes: string | null;
    paymentMode: string | null;
    paymentStatus: string;
    requiresPayment: boolean;
    isPaid: boolean;
    paymentConfirmedAt: string | null;
  };
  selectedEvents: Array<{
    id: string;
    name: string;
    date: string;
    price: number;
    status: string;
  }>;
}

interface ConferenceResponse {
  success: boolean;
  data: ConferenceData[];
  count: number;
}

const fetchConferences = async (token: string): Promise<ConferenceResponse> => {
  const response = await fetch('/api/admin/conference', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch conference registrations');
  }

  return result;
};

export const useAdminConferences = () => {
  const { sessionToken, isAuthenticated } = useAdminStore();

  return useQuery({
    queryKey: ['admin-conferences'],
    queryFn: () => fetchConferences(sessionToken!),
    enabled: isAuthenticated && !!sessionToken,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
};

// Enhanced realtime hook with fallback mechanism
export const useAdminConferencesRealtime = () => {
  const { sessionToken, isAuthenticated } = useAdminStore();
  
  return useRealtimeWithFallback({
    queryKey: ['admin-conferences'],
    fetchFunction: () => fetchConferences(sessionToken!),
    enabled: isAuthenticated && !!sessionToken,
    staleTime: 1000 * 60 * 5,
    tablesToWatch: ['conferences', 'conference_payments', 'summary_of_payments', 'user_details', 'user_accounts'],
    enableFallback: true,
    fallbackInterval: 30000, // 30 seconds
  });
};

const deleteConference = async (conferenceId: string, token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/admin/conference/${conferenceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete conference registration');
  }

  return result;
};

export const useDeleteConference = () => {
  const { sessionToken } = useAdminStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conferenceId: string) => deleteConference(conferenceId, sessionToken!),
    onSuccess: () => {
      // Refetch the conferences list after successful deletion
      queryClient.invalidateQueries({ queryKey: ['admin-conferences'] });
    },
    onError: (error) => {
      console.error('Delete conference error:', error);
    },
  });
};

// Payment status update types
interface PaymentStatusUpdateData {
  conferenceId: string;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  notes?: string;
}

const updatePaymentStatus = async (
  data: PaymentStatusUpdateData,
  token: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  const response = await fetch(`/api/admin/conference/${data.conferenceId}/payment-status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentStatus: data.paymentStatus,
      notes: data.notes,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update payment status');
  }

  return result;
};

export const useUpdatePaymentStatus = () => {
  const { sessionToken } = useAdminStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentStatusUpdateData) => updatePaymentStatus(data, sessionToken!),
    onSuccess: () => {
      // Don't invalidate immediately - let realtime handle it to avoid double updates
      // Add a fallback invalidation in case realtime is not working (after 2 seconds)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-conferences'] });
        console.log('Fallback data refresh for payment status update');
      }, 2000);
    },
    onError: (error) => {
      console.error('Update payment status error:', error);
    },
  });
};