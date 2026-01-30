import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

const POSTS_PER_PAGE = 10;

// Trending feed - all posts
export function useFeedPosts() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['posts', 'feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (error) throw error;

      const postIds = posts.map(p => p.id);
      const userIds = [...new Set(posts.map(p => p.user_id))];
      
      const [likesResult, commentsResult, userLikesResult, profilesResult] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        user ? supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id) : Promise.resolve({ data: [] }),
        supabase.from('profiles').select('user_id, username, full_name, avatar_url').in('user_id', userIds),
      ]);

      const profilesMap = (profilesResult.data || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      const likesCount = postIds.reduce((acc, id) => {
        acc[id] = likesResult.data?.filter(l => l.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = postIds.reduce((acc, id) => {
        acc[id] = commentsResult.data?.filter(c => c.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set(userLikesResult.data?.map(l => l.post_id) || []);

      return posts.map(post => ({
        ...post,
        profile: profilesMap[post.user_id],
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        is_liked: userLikes.has(post.id),
      })) as Post[];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < POSTS_PER_PAGE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
  });
}

// Following feed - only posts from people you follow
export function useFollowingPosts() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['posts', 'following', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return [];

      // Get list of users we follow
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const followingIds = following?.map(f => f.following_id) || [];
      
      // Include own posts too
      const allIds = [...followingIds, user.id];

      if (allIds.length === 0) return [];

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .in('user_id', allIds)
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (error) throw error;

      const postIds = posts.map(p => p.id);
      const userIds = [...new Set(posts.map(p => p.user_id))];
      
      const [likesResult, commentsResult, userLikesResult, profilesResult] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
        supabase.from('profiles').select('user_id, username, full_name, avatar_url').in('user_id', userIds),
      ]);

      const profilesMap = (profilesResult.data || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      const likesCount = postIds.reduce((acc, id) => {
        acc[id] = likesResult.data?.filter(l => l.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = postIds.reduce((acc, id) => {
        acc[id] = commentsResult.data?.filter(c => c.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set(userLikesResult.data?.map(l => l.post_id) || []);

      return posts.map(post => ({
        ...post,
        profile: profilesMap[post.user_id],
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        is_liked: userLikes.has(post.id),
      })) as Post[];
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < POSTS_PER_PAGE) return undefined;
      return pages.length;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
  });
}

export function useUserPosts(userId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .eq('user_id', userId)
        .single();

      const postIds = posts.map(p => p.id);
      
      const [likesResult, commentsResult, userLikesResult] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        user ? supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.id) : Promise.resolve({ data: [] }),
      ]);

      const likesCount = postIds.reduce((acc, id) => {
        acc[id] = likesResult.data?.filter(l => l.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = postIds.reduce((acc, id) => {
        acc[id] = commentsResult.data?.filter(c => c.post_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set(userLikesResult.data?.map(l => l.post_id) || []);

      return posts.map(post => ({
        ...post,
        profile: profileData ? { username: profileData.username, full_name: profileData.full_name, avatar_url: profileData.avatar_url } : undefined,
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        is_liked: userLikes.has(post.id),
      })) as Post[];
    },
    enabled: !!userId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          image_url: imageUrl || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update
    onMutate: async ({ content, imageUrl }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      const previousPosts = queryClient.getQueryData(['posts', 'feed']);
      
      // We'll let the real query refetch handle the update
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', 'feed'], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, userId: postUserId }: { postId: string; userId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) throw error;

      if (postUserId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postUserId,
          actor_id: user.id,
          type: 'like',
          post_id: postId,
        });
      }
    },
    // Optimistic update for instant feel
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      return { postId };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      return { postId };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
