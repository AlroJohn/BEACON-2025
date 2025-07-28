import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useCallback, useState, useRef } from "react";
import { toast } from "sonner";

interface RealtimeHookOptions {
  queryKey: string[];
  fetchFunction: () => Promise<any>;
  enabled: boolean;
  staleTime?: number;
  tablesToWatch: string[];
  enableFallback?: boolean;
  fallbackInterval?: number;
}

/**
 * Enhanced realtime hook with fallback polling mechanism
 * Falls back to regular polling if realtime connection fails
 */
export const useRealtimeWithFallback = (options: RealtimeHookOptions) => {
  const {
    queryKey,
    fetchFunction,
    enabled,
    staleTime = 1000 * 60 * 5,
    tablesToWatch,
    enableFallback = true,
    fallbackInterval = 30000, // 30 seconds
  } = options;

  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'failed' | 'fallback'>('connecting');
  const [fallbackTimer, setFallbackTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasShownFallbackToast, setHasShownFallbackToast] = useState(false);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const queryKeyString = queryKey.join('-');
  const tablesToWatchString = tablesToWatch.join(',');

  // Stable callback references
  const stableInvalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKeyString]);

  // Base query
  const query = useQuery({
    queryKey,
    queryFn: fetchFunction,
    enabled,
    staleTime,
    retry: 1,
  });

  // Use the stable callback
  const invalidateQuery = stableInvalidateQuery;

  // Setup fallback polling
  const setupFallbackPolling = useCallback(() => {
    if (!enableFallback) return;

    console.log('🔄 Setting up fallback polling...');
    setRealtimeStatus('fallback');

    const timer = setInterval(() => {
      console.log('🔄 Fallback poll - refreshing data...');
      invalidateQuery();
    }, fallbackInterval);

    setFallbackTimer(timer);

    // Only show toast once when entering fallback mode
    if (!hasShownFallbackToast) {
      // toast.warning('⚠️ Using polling fallback for updates');
      setHasShownFallbackToast(true);
    }
  }, [enableFallback, fallbackInterval, invalidateQuery, hasShownFallbackToast]);

  // Clear fallback polling
  const clearFallbackPolling = useCallback(() => {
    if (fallbackTimer) {
      clearInterval(fallbackTimer);
      setFallbackTimer(null);
    }
  }, [fallbackTimer]);

  // Reset fallback toast flag when realtime connects
  const handleRealtimeConnected = useCallback(() => {
    setRealtimeStatus('connected');
    setHasShownFallbackToast(false); // Reset so toast can show again if fallback needed later
    clearFallbackPolling();
  }, [clearFallbackPolling]);

  // Setup realtime subscription - only run when essential dependencies change
  useEffect(() => {
    if (!enabled) {
      console.log('❌ Realtime not enabled');
      setRealtimeStatus('failed');
      setupFallbackPolling();
      return;
    }

    // Prevent multiple subscriptions
    if (isSubscribedRef.current) {
      console.log('⚠️ Subscription already exists, skipping...');
      return;
    }

    console.log('🚀 Setting up realtime subscription...');
    setRealtimeStatus('connecting');
    isSubscribedRef.current = true;

    // Shorter timeout and immediate fallback setup
    const subscriptionTimeout = setTimeout(() => {
      console.log('⏰ Realtime subscription timeout - using fallback');
      setRealtimeStatus('failed');
      setupFallbackPolling();
    }, 5000); // Reduced to 5 seconds

    try {
      // Create unique channel name
      const channelName = `${queryKeyString}-${Date.now()}`;
      const channel = supabase.channel(channelName);
      channelRef.current = channel;

      // Add listeners for each table
      tablesToWatch.forEach((table) => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          (payload) => {
            console.log(`📡 ${table} realtime change:`, payload);

            // Only show toast for main data tables, not for every related table
            if (['visitors', 'conferences'].includes(table)) {
              switch (payload.eventType) {
                case 'INSERT':
                  toast.success(`🎉 New ${table.slice(0, -1)} registration!`);
                  break;
                case 'UPDATE':
                  toast.info(`📝 ${table.slice(0, -1)} updated`);
                  break;
                case 'DELETE':
                  toast.info(`🗑️ ${table.slice(0, -1)} removed`);
                  break;
              }
            }

            // Add delay for data consistency
            setTimeout(() => {
              invalidateQuery();
            }, 100);
          }
        );
      });

      // Subscribe with improved error handling
      channel.subscribe((status) => {
        console.log(`📡 Realtime subscription status:`, status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected successfully');
          clearTimeout(subscriptionTimeout);
          handleRealtimeConnected();
        } else {
          // Any non-SUBSCRIBED status should trigger fallback
          console.log(`⚠️ Realtime status: ${status} - switching to fallback`);
          clearTimeout(subscriptionTimeout);
          setRealtimeStatus('failed');
          setupFallbackPolling();
        }
      });
    } catch (error) {
      console.error('❌ Error setting up realtime subscription:', error);
      clearTimeout(subscriptionTimeout);
      setRealtimeStatus('failed');
      setupFallbackPolling();
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up realtime subscription...');
      isSubscribedRef.current = false;
      clearTimeout(subscriptionTimeout);
      clearFallbackPolling();

      try {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
        console.log('✅ Realtime subscription cleaned up successfully');
      } catch (error) {
        console.log('ℹ️ Realtime subscription cleanup completed');
      }
    };
  }, [enabled, queryKeyString, tablesToWatchString]); // Simplified dependencies

  // Cleanup fallback timer on unmount
  useEffect(() => {
    return () => {
      clearFallbackPolling();
    };
  }, [clearFallbackPolling]);

  return {
    ...query,
    isRealtimeEnabled: realtimeStatus === 'connected',
    realtimeStatus,
    isFallbackMode: realtimeStatus === 'fallback',
  };
};