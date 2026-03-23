import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLikeReel, useUnlikeReel, useDeleteReel, Reel } from '@/hooks/useReels';
import { useReelComments, useCreateReelComment } from '@/hooks/useComments';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/hooks/useFollow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX, UserPlus, UserCheck, Send, Loader2, ArrowLeft, Trash2, Copy, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';

function useReel(reelId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reel', reelId],
    queryFn: async () => {
      const { data: reel, error } = await supabase
        .from('reels')
        .select('*')
        .eq('id', reelId)
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .eq('user_id', reel.user_id)
        .single();

      const [likesResult, commentsResult, userLikeResult] = await Promise.all([
        supabase.from('reel_likes').select('id').eq('reel_id', reelId),
        supabase.from('reel_comments').select('id').eq('reel_id', reelId),
        user ? supabase.from('reel_likes').select('id').eq('reel_id', reelId).eq('user_id', user.id) : Promise.resolve({ data: [] }),
      ]);

      return {
        ...reel,
        profile: profile ? { username: profile.username, full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
        likes_count: likesResult.data?.length || 0,
        comments_count: commentsResult.data?.length || 0,
        is_liked: (userLikeResult.data?.length || 0) > 0,
      } as Reel;
    },
    enabled: !!reelId,
  });
}

export default function ReelViewPage() {
  const { reelId } = useParams<{ reelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: reel, isLoading } = useReel(reelId || '');
  const { data: comments = [] } = useReelComments(reelId || '');
  const createComment = useCreateReelComment();
  const likeReel = useLikeReel();
  const unlikeReel = useUnlikeReel();
  const deleteReel = useDeleteReel();
  const { data: isFollowing } = useFollowStatus(reel?.user_id || '');
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">Reel not found</p>
        <Button variant="link" onClick={() => navigate('/reels')}>Back to Reels</Button>
      </div>
    );
  }

  const isOwnReel = user?.id === reel.user_id;

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = () => {
    if (!user) { setShowAuthPrompt(true); return; }
    if (reel.is_liked) unlikeReel.mutate(reel.id);
    else likeReel.mutate({ reelId: reel.id, userId: reel.user_id });
  };

  const handleFollow = () => {
    if (!user) { setShowAuthPrompt(true); return; }
    if (isFollowing) unfollowUser.mutate(reel.user_id);
    else { followUser.mutate(reel.user_id); toast.success(`Following ${reel.profile?.full_name}`); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    try {
      await createComment.mutateAsync({ reelId: reel.id, content: commentText.trim(), reelUserId: reel.user_id });
      setCommentText('');
    } catch { toast.error('Failed to post comment'); }
  };

  const handleDelete = async () => {
    try {
      await deleteReel.mutateAsync(reel.id);
      toast.success('Reel deleted');
      navigate('/reels');
    } catch { toast.error('Failed to delete reel'); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: reel.caption || 'Check out this reel!', url: window.location.href });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate('/reels')}>
        <ArrowLeft className="h-4 w-4" /> Back to Reels
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Media */}
        <Card className="overflow-hidden">
          <AspectRatio ratio={9/16} className="bg-black">
            {reel.media_type === 'video' ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  src={reel.media_url}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={isMuted}
                  poster={reel.thumbnail_url || undefined}
                  onClick={handlePlayPause}
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer" onClick={handlePlayPause}>
                    <Play className="h-16 w-16 text-white" fill="white" />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="secondary" className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <img src={reel.media_url} alt="Reel" className="w-full h-full object-contain" />
            )}
          </AspectRatio>
        </Card>

        {/* Details & Comments */}
        <div className="flex flex-col gap-4">
          {/* User Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Link to={`/user/${reel.profile?.username}`}>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={reel.profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">{reel.profile?.full_name?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <Link to={`/user/${reel.profile?.username}`} className="font-semibold hover:underline">
                    {reel.profile?.full_name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    @{reel.profile?.username} · {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!isOwnReel && user && (
                  <Button variant={isFollowing ? 'secondary' : 'default'} size="sm" onClick={handleFollow}>
                    {isFollowing ? <><UserCheck className="h-4 w-4 mr-1" /> Following</> : <><UserPlus className="h-4 w-4 mr-1" /> Follow</>}
                  </Button>
                )}
              </div>
              {reel.caption && <p className="mt-3 text-sm">{reel.caption}</p>}

              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                <button onClick={handleLike} className={cn('flex items-center gap-2 text-sm', reel.is_liked ? 'text-accent' : 'text-muted-foreground hover:text-accent')}>
                  <Heart className={cn('h-5 w-5', reel.is_liked && 'fill-current')} /> {reel.likes_count}
                </button>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-5 w-5" /> {reel.comments_count}
                </span>
                <button onClick={handleShare} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Share2 className="h-5 w-5" /> Share
                </button>
                <button onClick={handleCopyLink} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary ml-auto">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {isOwnReel && (
                <div className="mt-3 pt-3 border-t">
                  <DeleteConfirmDialog
                    title="Delete Reel"
                    description="Are you sure? This action cannot be undone."
                    onConfirm={handleDelete}
                    isPending={deleteReel.isPending}
                    trigger={
                      <Button variant="outline" size="sm" className="text-destructive gap-2">
                        <Trash2 className="h-4 w-4" /> Delete Reel
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="flex-1">
            <CardContent className="p-4 flex flex-col h-full">
              <h3 className="font-semibold mb-3">Comments</h3>
              <ScrollArea className="flex-1 max-h-64">
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                  ) : comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={c.profile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">{c.profile?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">{c.profile?.username}</span>
                        <span className="text-xs text-muted-foreground ml-2">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                        <p className="text-sm">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {user && (
                <form onSubmit={handleComment} className="flex gap-2 mt-3 pt-3 border-t">
                  <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1" />
                  <Button type="submit" size="icon" disabled={!commentText.trim() || createComment.isPending}>
                    {createComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AuthPromptDialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt} title="Sign in to continue" description="Please sign in to interact with reels." />
    </div>
  );
}
