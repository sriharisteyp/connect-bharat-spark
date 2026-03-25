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
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reels')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-lg">Reel</span>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-6 p-0 lg:p-6">
        {/* Video / Media - YT style large player */}
        <div className="flex-1 bg-black lg:rounded-xl overflow-hidden">
          <div className="relative w-full" style={{ maxHeight: '80vh' }}>
            {reel.media_type === 'video' ? (
              <div className="relative w-full flex items-center justify-center" style={{ minHeight: '60vh', maxHeight: '80vh' }}>
                <video
                  ref={videoRef}
                  src={reel.media_url}
                  className="w-full h-full object-contain"
                  style={{ maxHeight: '80vh' }}
                  loop
                  playsInline
                  muted={isMuted}
                  poster={reel.thumbnail_url || undefined}
                  onClick={handlePlayPause}
                  onDoubleClick={handleLike}
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={handlePlayPause}>
                    <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-10 w-10 text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}
                {/* Bottom controls bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/20" onClick={handlePlayPause}>
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-10 w-10 text-white hover:bg-white/20" onClick={() => setIsMuted(!isMuted)}>
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ minHeight: '60vh', maxHeight: '80vh' }} onDoubleClick={handleLike}>
                <img src={reel.media_url} alt="Reel" className="w-full h-full object-contain" style={{ maxHeight: '80vh' }} />
              </div>
            )}
          </div>

          {/* Below video - YT style info */}
          <div className="bg-background p-4 lg:rounded-b-xl">
            {reel.caption && <h1 className="text-lg font-semibold mb-3">{reel.caption}</h1>}
            
            {/* Action buttons row */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Button
                variant={reel.is_liked ? 'default' : 'secondary'}
                size="sm"
                className="rounded-full gap-2"
                onClick={handleLike}
              >
                <Heart className={cn('h-4 w-4', reel.is_liked && 'fill-current')} />
                {reel.likes_count}
              </Button>
              <Button variant="secondary" size="sm" className="rounded-full gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="secondary" size="sm" className="rounded-full gap-2" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              {isOwnReel && (
                <DeleteConfirmDialog
                  title="Delete Reel"
                  description="Are you sure? This action cannot be undone."
                  onConfirm={handleDelete}
                  isPending={deleteReel.isPending}
                  trigger={
                    <Button variant="secondary" size="sm" className="rounded-full gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  }
                />
              )}
            </div>

            {/* Creator card */}
            <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
              <Link to={`/user/${reel.profile?.username}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={reel.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">{reel.profile?.full_name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/user/${reel.profile?.username}`} className="font-semibold text-sm hover:underline block truncate">
                  {reel.profile?.full_name}
                </Link>
                <p className="text-xs text-muted-foreground">@{reel.profile?.username} · {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}</p>
              </div>
              {!isOwnReel && user && (
                <Button variant={isFollowing ? 'secondary' : 'default'} size="sm" className="rounded-full" onClick={handleFollow}>
                  {isFollowing ? <><UserCheck className="h-4 w-4 mr-1" /> Following</> : <><UserPlus className="h-4 w-4 mr-1" /> Follow</>}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comments panel - YT style side panel on desktop */}
        <div className="w-full lg:w-96 flex flex-col bg-background lg:border lg:rounded-xl overflow-hidden" style={{ maxHeight: '80vh' }}>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Comments <span className="text-muted-foreground font-normal text-sm">({reel.comments_count})</span></h3>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
                </div>
              ) : comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <Link to={`/user/${c.profile?.username}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xs">{c.profile?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <Link to={`/user/${c.profile?.username}`} className="text-sm font-semibold hover:underline">@{c.profile?.username}</Link>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          {user ? (
            <form onSubmit={handleComment} className="p-3 border-t flex gap-2">
              <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 rounded-full" />
              <Button type="submit" size="icon" className="rounded-full" disabled={!commentText.trim() || createComment.isPending}>
                {createComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <div className="p-3 border-t text-center">
              <Button variant="link" onClick={() => setShowAuthPrompt(true)}>Sign in to comment</Button>
            </div>
          )}
        </div>
      </div>

      <AuthPromptDialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt} title="Sign in to continue" description="Please sign in to interact with reels." />
    </div>
  );
}
