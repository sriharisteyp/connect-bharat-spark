import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Reel {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'video' | 'image';
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
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

const REELS_PER_PAGE = 10;

// Trending reels - all reels
export function useReelsFeed() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['reels', 'feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: reels, error } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam * REELS_PER_PAGE, (pageParam + 1) * REELS_PER_PAGE - 1);

      if (error) throw error;

      const reelIds = reels.map(r => r.id);
      const userIds = [...new Set(reels.map(r => r.user_id))];

      const [likesResult, commentsResult, userLikesResult, profilesResult] = await Promise.all([
        supabase.from('reel_likes').select('reel_id').in('reel_id', reelIds),
        supabase.from('reel_comments').select('reel_id').in('reel_id', reelIds),
        user ? supabase.from('reel_likes').select('reel_id').in('reel_id', reelIds).eq('user_id', user.id) : Promise.resolve({ data: [] }),
        supabase.from('profiles').select('user_id, username, full_name, avatar_url').in('user_id', userIds),
      ]);

      const profilesMap = (profilesResult.data || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      const likesCount = reelIds.reduce((acc, id) => {
        acc[id] = likesResult.data?.filter(l => l.reel_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = reelIds.reduce((acc, id) => {
        acc[id] = commentsResult.data?.filter(c => c.reel_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set(userLikesResult.data?.map(l => l.reel_id) || []);

      return reels.map(reel => ({
        ...reel,
        profile: profilesMap[reel.user_id],
        likes_count: likesCount[reel.id] || 0,
        comments_count: commentsCount[reel.id] || 0,
        is_liked: userLikes.has(reel.id),
      })) as Reel[];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < REELS_PER_PAGE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
  });
}

// Following reels - only from people you follow
export function useFollowingReels() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['reels', 'following', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [];

      // Get list of users we follow
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const followingIds = following?.map(f => f.following_id) || [];
      const allIds = [...followingIds, user.id];

      if (allIds.length === 0) return [];

      const { data: reels, error } = await supabase
        .from('reels')
        .select('*')
        .in('user_id', allIds)
        .order('created_at', { ascending: false })
        .range(pageParam * REELS_PER_PAGE, (pageParam + 1) * REELS_PER_PAGE - 1);

      if (error) throw error;

      const reelIds = reels.map(r => r.id);
      const userIds = [...new Set(reels.map(r => r.user_id))];

      const [likesResult, commentsResult, userLikesResult, profilesResult] = await Promise.all([
        supabase.from('reel_likes').select('reel_id').in('reel_id', reelIds),
        supabase.from('reel_comments').select('reel_id').in('reel_id', reelIds),
        supabase.from('reel_likes').select('reel_id').in('reel_id', reelIds).eq('user_id', user.id),
        supabase.from('profiles').select('user_id, username, full_name, avatar_url').in('user_id', userIds),
      ]);

      const profilesMap = (profilesResult.data || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      const likesCount = reelIds.reduce((acc, id) => {
        acc[id] = likesResult.data?.filter(l => l.reel_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = reelIds.reduce((acc, id) => {
        acc[id] = commentsResult.data?.filter(c => c.reel_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set(userLikesResult.data?.map(l => l.reel_id) || []);

      return reels.map(reel => ({
        ...reel,
        profile: profilesMap[reel.user_id],
        likes_count: likesCount[reel.id] || 0,
        comments_count: commentsCount[reel.id] || 0,
        is_liked: userLikes.has(reel.id),
      })) as Reel[];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < REELS_PER_PAGE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
  });
}

export function useUserReels(userId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reels', 'user', userId],
    queryFn: async () => {
      const { data: reels, error } = await supabase
        .from('reels')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .eq('user_id', userId)
        .single();

      const reelIds = reels.map(r => r.id);

      const [likesResult, commentsResult, userLikesResult] = await Promise.all([
        supabase.from('reel_likes').select('reel_id').in('reel_id', reelIds),
        supabase.from('reel_comments').select('reel_id').in('reel_id', reelIds),
        user ? supabase.from('reel_likes').select('reel_id').in('reel_id', reelIds).eq('user_id', user.id) : Promise.resolve({ data: [] }),
      ]);

      const likesCount = reelIds.reduce((acc, id) => {
        acc[id] = likesResult.data?.filter(l => l.reel_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = reelIds.reduce((acc, id) => {
        acc[id] = commentsResult.data?.filter(c => c.reel_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set(userLikesResult.data?.map(l => l.reel_id) || []);

      return reels.map(reel => ({
        ...reel,
        profile: profileData ? { username: profileData.username, full_name: profileData.full_name, avatar_url: profileData.avatar_url } : undefined,
        likes_count: likesCount[reel.id] || 0,
        comments_count: commentsCount[reel.id] || 0,
        is_liked: userLikes.has(reel.id),
      })) as Reel[];
    },
    enabled: !!userId,
  });
}

export function useCreateReel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mediaUrl, mediaType, caption, thumbnailUrl }: { 
      mediaUrl: string; 
      mediaType: 'video' | 'image'; 
      caption?: string;
      thumbnailUrl?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reels')
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: caption || null,
          thumbnail_url: thumbnailUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

export function useDeleteReel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reelId: string) => {
      const { error } = await supabase
        .from('reels')
        .delete()
        .eq('id', reelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

export function useLikeReel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reelId, userId: reelUserId }: { reelId: string; userId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reel_likes')
        .insert({
          reel_id: reelId,
          user_id: user.id,
        });

      if (error) throw error;

      if (reelUserId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: reelUserId,
          actor_id: user.id,
          type: 'reel_like',
        });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['reels'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
}

export function useUnlikeReel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reelId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('reel_likes')
        .delete()
        .eq('reel_id', reelId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['reels'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
  });
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

      if (reelUserId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: reelUserId,
          actor_id: user.id,
          type: 'reel_comment',
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

export function useUploadReelMedia() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('reels')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reels')
        .getPublicUrl(fileName);

      return publicUrl;
    },
  });
}
