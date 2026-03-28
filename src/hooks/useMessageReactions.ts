import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥'] as const;

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface ReactionGroup {
  reaction: string;
  count: number;
  hasReacted: boolean;
}

export function useMessageReactions(messageIds: string[], table: 'message_reactions' | 'group_message_reactions' = 'message_reactions') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reactions', table, messageIds],
    queryFn: async () => {
      if (messageIds.length === 0) return {};

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .in('message_id', messageIds);

      if (error) throw error;

      const grouped: Record<string, ReactionGroup[]> = {};
      const byMessage: Record<string, Record<string, { count: number; users: string[] }>> = {};

      (data || []).forEach((r: any) => {
        if (!byMessage[r.message_id]) byMessage[r.message_id] = {};
        if (!byMessage[r.message_id][r.reaction]) byMessage[r.message_id][r.reaction] = { count: 0, users: [] };
        byMessage[r.message_id][r.reaction].count++;
        byMessage[r.message_id][r.reaction].users.push(r.user_id);
      });

      Object.entries(byMessage).forEach(([msgId, reactions]) => {
        grouped[msgId] = Object.entries(reactions).map(([reaction, info]) => ({
          reaction,
          count: info.count,
          hasReacted: info.users.includes(user?.id || ''),
        }));
      });

      return grouped;
    },
    enabled: messageIds.length > 0 && !!user?.id,
  });
}

export function useToggleReaction(table: 'message_reactions' | 'group_message_reactions' = 'message_reactions') {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if already reacted
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction', reaction)
        .maybeSingle();

      if (existing) {
        await supabase.from(table).delete().eq('id', existing.id);
      } else {
        const { error } = await supabase.from(table).insert({
          message_id: messageId,
          user_id: user.id,
          reaction,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', table] });
    },
  });
}
