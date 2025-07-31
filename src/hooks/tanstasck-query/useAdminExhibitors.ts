import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/stores/adminStore";
import { useRealtimeWithFallback } from "./useRealtimeWithFallback";

interface ExhibitorData {
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
  exhibitionInfo: {
    participationTypes: string[];
    boothSize: string;
    boothDescription: string;
    launchNewProduct: string;
    requireDemoArea: string;
  };
  logisticsInfo: {
    bringLargeEquipment: string;
    haveMarketingCollaterals: string;
    logoUrl: string;
  };
  goalsInfo: {
    goals: string[];
    goalsOthers: string;
    exploreSponsorship: string;
  };
  confirmationInfo: {
    confirmIntent: string;
    letterOfIntentUrl: string;
    additionalComments: string;
  };
}

interface ExhibitorsResponse {
  success: boolean;
  data: ExhibitorData[];
  count: number;
}

const fetchExhibitors = async (token: string): Promise<ExhibitorsResponse> => {
  const response = await fetch('/api/admin/exhibitors', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch exhibitors');
  }

  return result;
};

export const useAdminExhibitors = () => {
  const { sessionToken, isAuthenticated } = useAdminStore();

  return useQuery({
    queryKey: ['admin-exhibitors'],
    queryFn: () => fetchExhibitors(sessionToken!),
    enabled: isAuthenticated && !!sessionToken,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
};

// Enhanced realtime hook with fallback mechanism
export const useAdminExhibitorsRealtime = () => {
  const { sessionToken, isAuthenticated } = useAdminStore();
  
  return useRealtimeWithFallback({
    queryKey: ['admin-exhibitors'],
    fetchFunction: () => fetchExhibitors(sessionToken!),
    enabled: isAuthenticated && !!sessionToken,
    staleTime: 1000 * 60 * 5,
    tablesToWatch: ['exhibitor_registrations', 'user_details', 'user_accounts'],
    enableFallback: true,
    fallbackInterval: 30000, // 30 seconds
  });
};

const deleteExhibitor = async (exhibitorId: string, token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/admin/exhibitors/${exhibitorId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to delete exhibitor');
  }

  return result;
};

export const useDeleteExhibitor = () => {
  const { sessionToken } = useAdminStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exhibitorId: string) => deleteExhibitor(exhibitorId, sessionToken!),
    onSuccess: () => {
      // Refetch the exhibitors list after successful deletion
      queryClient.invalidateQueries({ queryKey: ['admin-exhibitors'] });
    },
    onError: (error) => {
      console.error('Delete exhibitor error:', error);
    },
  });
};