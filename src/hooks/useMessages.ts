import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all messages involving the user
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationsMap = new Map<string, {
        last_message: string;
        last_message_at: string;
        unread_count: number;
      }>();

      messages?.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }

        if (msg.receiver_id === user.id && !msg.is_read) {
          const conv = conversationsMap.get(partnerId)!;
          conv.unread_count++;
        }
      });

      // Get profiles for all conversation partners
      const partnerIds = Array.from(conversationsMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', partnerIds);

      if (profilesError) throw profilesError;

      return partnerIds.map(partnerId => {
        const profile = profiles?.find(p => p.user_id === partnerId);
        const conv = conversationsMap.get(partnerId)!;
        
        return {
          user_id: partnerId,
          username: profile?.username || 'Unknown',
          full_name: profile?.full_name || 'Unknown User',
          avatar_url: profile?.avatar_url,
          ...conv,
        } as Conversation;
      }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    },
    enabled: !!user?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === user.id || msg.receiver_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
            queryClient.invalidateQueries({ queryKey: ['messages'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
}

export function useConversationMessages(partnerId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', user?.id, partnerId],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get profiles for senders
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', senderIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      return messages.map(msg => ({
        ...msg,
        sender: profilesMap[msg.sender_id],
      })) as Message[];
    },
    enabled: !!user?.id && !!partnerId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_id: receiverId,
        actor_id: user.id,
        type: 'message',
        message_preview: content.substring(0, 100),
      });

      return data;
    },
    onSuccess: (_, { receiverId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id, receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });
}

export function useUnreadMessagesCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', 'unread', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (senderId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: (_, senderId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id, senderId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });
}
