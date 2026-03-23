import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_default: boolean;
  created_at: string;
  created_by: string;
  member_count?: number;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function useGroupChats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['group-chats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const groupIds = data.map(g => g.id);
      const { data: members } = await supabase
        .from('group_members')
        .select('group_id')
        .in('group_id', groupIds);

      const counts: Record<string, number> = {};
      members?.forEach(m => {
        counts[m.group_id] = (counts[m.group_id] || 0) + 1;
      });

      return data.map(g => ({
        ...g,
        member_count: counts[g.id] || 0,
      })) as GroupChat[];
    },
    enabled: !!user?.id,
  });
}

export function useGroupMessages(groupId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data: messages, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;

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
      })) as GroupMessage[];
    },
    enabled: !!groupId && !!user?.id,
  });

  useEffect(() => {
    if (!groupId || !user?.id) return;

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, queryClient]);

  return query;
}

export function useSendGroupMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
    },
  });
}

export function useCreateGroupChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create the group
      const { data: group, error } = await supabase
        .from('group_chats')
        .insert({
          name,
          description: description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-chats'] });
    },
  });
}

export function useUpdateGroupChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, name, avatar_url }: { groupId: string; name?: string; avatar_url?: string }) => {
      const updates: Record<string, string> = {};
      if (name) updates.name = name;
      if (avatar_url) updates.avatar_url = avatar_url;

      const { error } = await supabase
        .from('group_chats')
        .update(updates)
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-chats'] });
    },
  });
}

export function useDeleteGroupChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('group_chats')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-chats'] });
    },
  });
}

export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const { data: members, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;

      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      return members.map(m => ({
        ...m,
        profile: profilesMap[m.user_id],
      })) as GroupMember[];
    },
    enabled: !!groupId,
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        });

      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-chats'] });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-chats'] });
    },
  });
}

export function usePromoteToAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    },
  });
}

export function useDemoteFromAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'member' })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    },
  });
}
