import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

// Hook to track current user's online presence
export function useTrackPresence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const updatePresence = async (isOnline: boolean) => {
      try {
        const { data: existing } = await supabase
          .from('user_presence')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existing) {
          await supabase
            .from('user_presence')
            .update({ 
              is_online: isOnline, 
              last_seen: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('user_presence')
            .insert({ 
              user_id: user.id, 
              is_online: isOnline,
              last_seen: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Failed to update presence:', error);
      }
    };

    // Set online immediately
    updatePresence(true);

    // Update presence every 30 seconds
    intervalRef.current = setInterval(() => {
      updatePresence(true);
    }, 30000);

    // Handle visibility change
    const handleVisibilityChange = () => {
      updatePresence(!document.hidden);
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status
      const data = JSON.stringify({
        user_id: user.id,
        is_online: false,
        last_seen: new Date().toISOString()
      });
      navigator.sendBeacon && navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`,
        data
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence(false);
    };
  }, [user?.id]);
}

// Hook to get a user's online status
export function useUserPresence(userId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['presence', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Consider user offline if last seen > 1 minute ago
      if (data) {
        const lastSeen = new Date(data.last_seen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeen.getTime();
        const isOnline = data.is_online && diffMs < 60000; // 1 minute threshold
        return { ...data, is_online: isOnline } as UserPresence;
      }
      
      return null;
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['presence', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

// Hook for typing indicators using Supabase Realtime presence
export function useTypingIndicator(conversationPartnerId: string) {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.id || !conversationPartnerId) return;

    const channelName = [user.id, conversationPartnerId].sort().join(':');
    channelRef.current = supabase.channel(`typing:${channelName}`, {
      config: { presence: { key: user.id } },
    });

    channelRef.current.subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user?.id, conversationPartnerId]);

  const setTyping = (isTyping: boolean) => {
    if (channelRef.current && user?.id) {
      channelRef.current.track({ isTyping, userId: user.id });
    }
  };

  return { setTyping };
}

export function useTypingSubscription(conversationPartnerId: string) {
  const { user } = useAuth();
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  useEffect(() => {
    if (!user?.id || !conversationPartnerId) return;

    const channelName = [user.id, conversationPartnerId].sort().join(':');
    const channel = supabase.channel(`typing:${channelName}`, {
      config: { presence: { key: conversationPartnerId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const partnerState = state[conversationPartnerId];
        if (partnerState && partnerState.length > 0) {
          const latestState = partnerState[partnerState.length - 1] as { isTyping?: boolean };
          setIsPartnerTyping(latestState.isTyping || false);
        } else {
          setIsPartnerTyping(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, conversationPartnerId]);

  return isPartnerTyping;
}

// Need to import useState for the typing subscription
import { useState } from 'react';
