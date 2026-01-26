import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  receiver?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// Get pending friend requests received by the user
export function usePendingFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests', 'pending', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get sender profiles
      const senderIds = requests.map(r => r.sender_id);
      if (senderIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', senderIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      return requests.map(req => ({
        ...req,
        sender: profilesMap[req.sender_id],
      })) as FriendRequest[];
    },
    enabled: !!user?.id,
  });
}

// Get friend request status between current user and another user
export function useFriendRequestStatus(userId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-request-status', user?.id, userId],
    queryFn: async () => {
      if (!user?.id || !userId) return null;

      // Check for any request between the two users
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as FriendRequest | null;
    },
    enabled: !!user?.id && !!userId && user.id !== userId,
  });
}

// Get all accepted friends (both directions)
export function useAcceptedFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', 'accepted', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all accepted friend requests where user is either sender or receiver
      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) throw error;

      // Get friend IDs (the other person in each request)
      const friendIds = requests.map(r => 
        r.sender_id === user.id ? r.receiver_id : r.sender_id
      );

      if (friendIds.length === 0) return [];

      // Get profiles for all friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', friendIds);

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      }));
    },
    enabled: !!user?.id,
  });
}

// Check if two users are friends (accepted request)
export function useAreFriends(userId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['are-friends', user?.id, userId],
    queryFn: async () => {
      if (!user?.id || !userId) return false;

      const { data, error } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('status', 'accepted')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user?.id && !!userId && user.id !== userId,
  });
}

// Send friend request
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: receiverId,
        actor_id: user.id,
        type: 'friend_request',
      });

      return data;
    },
    onSuccess: (_, receiverId) => {
      queryClient.invalidateQueries({ queryKey: ['friend-request-status', user?.id, receiverId] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

// Accept friend request
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('receiver_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Create notification for sender
      await supabase.from('notifications').insert({
        user_id: data.sender_id,
        actor_id: user.id,
        type: 'friend_accepted',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friend-request-status'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['are-friends'] });
    },
  });
}

// Reject friend request
export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('receiver_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friend-request-status'] });
    },
  });
}

// Cancel sent friend request
export function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      queryClient.invalidateQueries({ queryKey: ['friend-request-status'] });
    },
  });
}

// Count pending friend requests
export function usePendingFriendRequestsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friend-requests', 'count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('friend_requests')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });
}
