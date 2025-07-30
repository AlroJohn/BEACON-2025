import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExhibitorRegistrationFormData, ExhibitorRegistrationResponse } from '@/types/exhibitor/registration';

interface ExhibitorRegistrationMutationData extends Omit<ExhibitorRegistrationFormData, 'logoUrl' | 'letterOfIntentUrl'> {
  logoFile?: File | null;
  letterOfIntentFile?: File | null;
  logoUrl?: File | string | null;
  letterOfIntentUrl?: File | string | null;
}

const submitExhibitorRegistration = async (data: ExhibitorRegistrationMutationData): Promise<ExhibitorRegistrationResponse> => {
  const formData = new FormData();

  // Handle file uploads
  if (data.logoUrl instanceof File) {
    formData.append('logoFile', data.logoUrl);
    console.log('Logo file attached:', data.logoUrl.name, 'Type:', data.logoUrl.type);
  }
  if (data.letterOfIntentUrl instanceof File) {
    formData.append('letterOfIntentFile', data.letterOfIntentUrl);
    console.log('Letter file attached:', data.letterOfIntentUrl.name, 'Type:', data.letterOfIntentUrl.type);
  }

  // Add form fields to FormData
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'logoFile' || key === 'letterOfIntentFile' || key === 'logoUrl' || key === 'letterOfIntentUrl') {
      // Skip file fields as they're handled above
      return;
    } else if (Array.isArray(value)) {
      // Handle arrays (participationTypes, goals)
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      // Handle all other fields
      formData.append(key, String(value));
    }
  });

  const response = await fetch('/api/exhibitors', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Registration failed');
  }

  return response.json();
};

export const useExhibitorRegistrationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitExhibitorRegistration,
    onSuccess: (data) => {
      console.log('Exhibitor registration successful:', data);

      // Invalidate and refetch any related queries
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'exhibitors'] });
    },
    onError: (error) => {
      console.error('Exhibitor registration failed:', error);
    },
  });
};

// Hook for fetching exhibitor registrations
export const useExhibitorQuery = (userId?: string, email?: string, exhibitorId?: string) => {
  const queryParams = new URLSearchParams();

  if (userId) queryParams.append('userId', userId);
  if (email) queryParams.append('email', email);
  if (exhibitorId) queryParams.append('exhibitorId', exhibitorId);

  return fetch(`/api/exhibitors?${queryParams.toString()}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitor registrations');
      }
      return response.json();
    });
};

// Type for update operations
interface ExhibitorUpdateData extends Partial<ExhibitorRegistrationFormData> {
  exhibitorId: string;
}

const updateExhibitorRegistration = async (data: ExhibitorUpdateData): Promise<ExhibitorRegistrationResponse> => {
  const response = await fetch('/api/exhibitors', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Update failed');
  }

  return response.json();
};

export const useExhibitorUpdateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExhibitorRegistration,
    onSuccess: (data) => {
      console.log('Exhibitor registration updated successfully:', data);

      // Invalidate and refetch any related queries
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'exhibitors'] });
    },
    onError: (error) => {
      console.error('Exhibitor registration update failed:', error);
    },
  });
};

// Delete exhibitor registration
const deleteExhibitorRegistration = async (exhibitorId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`/api/exhibitors?exhibitorId=${exhibitorId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Delete failed');
  }

  return response.json();
};

export const useExhibitorDeleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExhibitorRegistration,
    onSuccess: (data) => {
      console.log('Exhibitor registration deleted successfully:', data);

      // Invalidate and refetch any related queries
      queryClient.invalidateQueries({ queryKey: ['exhibitors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'exhibitors'] });
    },
    onError: (error) => {
      console.error('Exhibitor registration deletion failed:', error);
    },
  });
};