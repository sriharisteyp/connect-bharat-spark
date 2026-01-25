import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

// Get all people the user follows (friends)
export function useFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all users that the current user follows
      const { data: follows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;
      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map(f => f.following_id);

      // Get profiles for all followed users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .in('user_id', followingIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
      })) as Friend[];
    },
    enabled: !!user?.id,
  });
}
