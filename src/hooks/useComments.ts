import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get profiles for all commenters
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      return comments.map(comment => ({
        ...comment,
        profile: profilesMap[comment.user_id],
      })) as Comment[];
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content, postUserId }: { postId: string; content: string; postUserId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification if commenting on someone else's post
      if (postUserId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postUserId,
          actor_id: user.id,
          type: 'comment',
          post_id: postId,
          message_preview: content.substring(0, 100),
        });
      }

      return data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export function useReelComments(reelId: string) {
  return useQuery({
    queryKey: ['reel-comments', reelId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('reel_comments')
        .select('*')
        .eq('reel_id', reelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get profiles for all commenters
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      return comments.map(comment => ({
        ...comment,
        profile: profilesMap[comment.user_id],
      })) as ReelComment[];
    },
    enabled: !!reelId,
  });
}

export function useCreateReelComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reelId, content, reelUserId }: { reelId: string; content: string; reelUserId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reel_comments')
        .insert({
          reel_id: reelId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification if commenting on someone else's reel
      if (reelUserId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: reelUserId,
          actor_id: user.id,
          type: 'comment',
          message_preview: content.substring(0, 100),
        });
      }

      return data;
    },
    onSuccess: (_, { reelId }) => {
      queryClient.invalidateQueries({ queryKey: ['reel-comments', reelId] });
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}
