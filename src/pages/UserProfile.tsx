import { useParams, useNavigate } from 'react-router-dom';
import { useProfileByUsername } from '@/hooks/useProfile';
import { useUserPosts } from '@/hooks/usePosts';
import { useFollowCounts, useFollowStatus, useFollowUser, useUnfollowUser } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserMinus, MessageCircle, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfileByUsername(username || '');
  const { data: posts, isLoading: postsLoading } = useUserPosts(profile?.user_id || '');
  const { data: followCounts } = useFollowCounts(profile?.user_id || '');
  const { data: isFollowing, isLoading: followStatusLoading } = useFollowStatus(profile?.user_id || '');
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const isOwnProfile = user?.id === profile?.user_id;

  const handleFollowToggle = () => {
    if (!profile?.user_id) return;
    
    if (isFollowing) {
      unfollowUser.mutate(profile.user_id);
    } else {
      followUser.mutate(profile.user_id);
    }
  };

  const handleMessage = () => {
    if (!profile?.user_id) return;
    navigate(`/messages/${profile.user_id}`);
  };

  if (profileLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            User not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile.full_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold">{profile.full_name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            
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

            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={handleFollowToggle}
                  disabled={followStatusLoading || followUser.isPending || unfollowUser.isPending}
                  variant={isFollowing ? 'outline' : 'default'}
                  className="min-w-[120px]"
                >
                  {followUser.isPending || unfollowUser.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                <Button onClick={handleMessage} variant="secondary">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            )}

            {isOwnProfile && (
              <Link to="/settings" className="mt-4">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </Link>
            )}
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
