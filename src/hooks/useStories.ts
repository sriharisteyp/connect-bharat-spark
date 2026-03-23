import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  profile?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  view_count?: number;
  has_viewed?: boolean;
}

export interface StoryGroup {
  user_id: string;
  profile: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  stories: Story[];
  has_unviewed: boolean;
}

// Fetch stories only from friends (people you follow who follow you back)
export function useStories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get mutual friends (people you follow who follow you back)
      const [{ data: following }, { data: followers }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        supabase.from('follows').select('follower_id').eq('following_id', user.id),
      ]);

      const followingSet = new Set(following?.map(f => f.following_id) || []);
      const followerSet = new Set(followers?.map(f => f.follower_id) || []);
      
      // Friends = mutual follows + self
      const friendIds = [...followingSet].filter(id => followerSet.has(id));
      friendIds.push(user.id);

      if (friendIds.length === 0) return [];

      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .in('user_id', friendIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(stories.map(s => s.user_id))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      const storyIds = stories.map(s => s.id);

      const [viewCountsResult, userViewsResult] = await Promise.all([
        supabase.from('story_views').select('story_id').in('story_id', storyIds),
        supabase.from('story_views').select('story_id').in('story_id', storyIds).eq('viewer_id', user.id),
      ]);

      const viewCounts = storyIds.reduce((acc, id) => {
        acc[id] = viewCountsResult.data?.filter(v => v.story_id === id).length || 0;
        return acc;
      }, {} as Record<string, number>);

      const userViews = new Set(userViewsResult.data?.map(v => v.story_id) || []);

      const groupedStories: StoryGroup[] = [];
      const userStoryMap = new Map<string, Story[]>();

      stories.forEach(story => {
        const enrichedStory: Story = {
          ...story,
          profile: profilesMap[story.user_id],
          view_count: viewCounts[story.id] || 0,
          has_viewed: userViews.has(story.id),
        };

        if (!userStoryMap.has(story.user_id)) {
          userStoryMap.set(story.user_id, []);
        }
        userStoryMap.get(story.user_id)!.push(enrichedStory);
      });

      const sortedUserIds = [...userStoryMap.keys()].sort((a, b) => {
        if (a === user.id) return -1;
        if (b === user.id) return 1;
        return 0;
      });

      sortedUserIds.forEach(userId => {
        const userStories = userStoryMap.get(userId)!;
        groupedStories.push({
          user_id: userId,
          profile: profilesMap[userId] || { username: 'Unknown', full_name: 'Unknown', avatar_url: null },
          stories: userStories,
          has_unviewed: userStories.some(s => !s.has_viewed),
        });
      });

      return groupedStories;
    },
    refetchInterval: 60000,
    enabled: !!user?.id,
  });
}

export function useUploadStoryMedia() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/stories/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Story upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      return publicUrl;
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ mediaUrl, mediaType, caption }: { mediaUrl: string; mediaType: string; caption?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: caption || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase.from('stories').delete().eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useViewStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (storyId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('story_views')
        .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useStoryViewers(storyId: string) {
  return useQuery({
    queryKey: ['story-viewers', storyId],
    queryFn: async () => {
      const { data: views, error } = await supabase
        .from('story_views')
        .select('viewer_id, viewed_at')
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      const viewerIds = views.map(v => v.viewer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', viewerIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, { username: string; full_name: string; avatar_url: string | null }>);

      return views.map(v => ({
        ...v,
        profile: profilesMap[v.viewer_id],
      }));
    },
    enabled: !!storyId,
  });
}
