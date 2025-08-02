import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/adminStore";
import { useRealtimeWithFallback } from "./useRealtimeWithFallback";

interface SponsorData {
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
    position: string;
  };
  contactInfo: {
    email: string;
    mobileNumber: string;
    landline: string;
    mailingAddress: string;
    status: string;
  };
  companyInfo: {
    companyName: string;
    businessRegistrationName: string;
    industrySector: string;
    industrySectorOthers: string;
    companyAddress: string;
    companyWebsite: string;
    companyProfile: string;
  };
  sponsorshipInfo: {
    sponsorshipCategories: string[];
    targetAudience: string[];
    targetAudienceOthers: string;
  };
  activationInfo: {
    activationPreferences: string;
    activationOthers: string;
    launchProduct: string;
  };
  budgetInfo: {
    budgetRange: string;
    customizedProposal: string;
    uploadLogoUrl: string;
    additionalComments: string;
  };
}

interface SponsorsResponse {
  success: boolean;
  data: SponsorData[];
  count: number;
}

const fetchSponsors = async (token: string): Promise<SponsorsResponse> => {
  const response = await fetch('/api/admin/sponsors', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch sponsors');
  }

  return result;
};

export const useAdminSponsors = () => {
  const { sessionToken, isAuthenticated } = useAdminStore();

  return useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: () => fetchSponsors(sessionToken!),
    enabled: isAuthenticated && !!sessionToken,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
};

// Enhanced realtime hook with fallback mechanism
export const useAdminSponsorsRealtime = () => {
  const { sessionToken, isAuthenticated } = useAdminStore();
  
  return useRealtimeWithFallback({
    queryKey: ['admin-sponsors'],
    fetchFunction: () => fetchSponsors(sessionToken!),
    enabled: isAuthenticated && !!sessionToken,
    staleTime: 1000 * 60 * 5,
    tablesToWatch: ['sponsor_registrations', 'user_details', 'user_accounts'],
    enableFallback: true,
    fallbackInterval: 30000, // 30 seconds
  });
};

const deleteSponsor = async (sponsorId: string, token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/admin/sponsors/${sponsorId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete sponsor');
  }

  return result;
};

export const useDeleteSponsor = () => {
  const { sessionToken } = useAdminStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sponsorId: string) => deleteSponsor(sponsorId, sessionToken!),
    onSuccess: () => {
      // Refetch the sponsors list after successful deletion
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
    },
    onError: (error) => {
      console.error('Delete sponsor error:', error);
    },
  });
};

// Update sponsor status function
const updateSponsorStatus = async (
  sponsorId: string, 
  status: 'ACTIVE' | 'INACTIVE', 
  notes: string | undefined,
  token: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/admin/sponsors/${sponsorId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update sponsor status');
  }

  return result;
};

export const useUpdateSponsorStatus = () => {
  const { sessionToken } = useAdminStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sponsorId, status, notes }: { 
      sponsorId: string; 
      status: 'ACTIVE' | 'INACTIVE'; 
      notes?: string 
    }) => updateSponsorStatus(sponsorId, status, notes, sessionToken!),
    onSuccess: () => {
      // Refetch the sponsors list after successful update
      queryClient.invalidateQueries({ queryKey: ['admin-sponsors'] });
    },
    onError: (error) => {
      console.error('Update sponsor status error:', error);
    },
  });
};