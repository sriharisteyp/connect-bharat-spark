import { useProfile } from '@/hooks/useProfile';
import { useUserPosts } from '@/hooks/usePosts';
import { useFollowCounts } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: posts, isLoading: postsLoading } = useUserPosts(user?.id || '');
  const { data: followCounts } = useFollowCounts(user?.id || '');

  if (profileLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold">{profile?.full_name}</h1>
            <p className="text-muted-foreground">@{profile?.username}</p>
            {profile?.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="font-bold">{posts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{followCounts?.followers || 0}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{followCounts?.following || 0}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>

            <Link to="/settings" className="mt-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* User Posts */}
      <h2 className="text-lg font-semibold">Posts</h2>
      {postsLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      ) : !posts || posts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No posts yet
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{post.content}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
