import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RegistrantCounts {
  VISITOR: number;
  CONFERENCE: number;
  EXHIBITOR: number;
  SPONSOR: number;
}

async function fetchRegistrantCounts(): Promise<RegistrantCounts> {
  const response = await fetch('/api/admin/dashboard/registrant-counts');
  
  if (!response.ok) {
    throw new Error('Failed to fetch registrant counts');
  }
  
  return response.json();
}

export function useRegistrantCounts() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['registrant-counts'],
    queryFn: fetchRegistrantCounts,
    staleTime: Infinity, // Don't auto-refetch since we use realtime
  });

  useEffect(() => {
    // Subscribe to user_accounts table changes via Supabase realtime
    const channel = supabase
      .channel('user_accounts_dashboard')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_accounts' 
      }, (payload) => {
        console.log('user_accounts change detected:', payload);
        // Refetch the counts when user_accounts changes
        queryClient.invalidateQueries({ queryKey: ['registrant-counts'] });
      })
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}