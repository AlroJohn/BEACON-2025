import { useQuery } from "@tanstack/react-query";

interface EmailCheckResponse {
  exists: boolean;
  message: string;
  registrationType?: string;
  existingUser?: boolean;
}

const checkEmailExists = async (email: string, registrationType?: string): Promise<EmailCheckResponse> => {
  if (!email || email.length < 3) {
    return { exists: false, message: "" };
  }

  const url = registrationType 
    ? `/api/check-email?email=${encodeURIComponent(email)}&type=${registrationType}`
    : `/api/check-email?email=${encodeURIComponent(email)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to check email");
  }

  return response.json();
};

export const useEmailValidation = (email: string, registrationType?: 'conference' | 'visitor' | 'exhibitor' | 'sponsor') => {
  return useQuery({
    queryKey: ["check-email", email, registrationType],
    queryFn: () => checkEmailExists(email, registrationType),
    enabled: !!email && email.includes("@"), // Only run if email looks valid
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
};