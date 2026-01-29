import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Heart, MessageCircle, Share2, Volume2, VolumeX, ChevronUp, ChevronDown, UserPlus, UserCheck, Send, Loader2 } from 'lucide-react';
import { useLikeReel, useUnlikeReel, Reel } from '@/hooks/useReels';
import { useReelComments, useCreateReelComment } from '@/hooks/useComments';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import { ShareReelDialog } from '@/components/ShareReelDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface FullscreenReelViewerProps {
  reels: Reel[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FullscreenReelViewer({ reels, initialIndex, open, onOpenChange }: FullscreenReelViewerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [commentText, setCommentText] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const currentReel = reels[currentIndex];

  const likeReel = useLikeReel();
  const unlikeReel = useUnlikeReel();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const createComment = useCreateReelComment();
  
  const { data: isFollowing } = useFollowStatus(currentReel?.user_id || '');
  const { data: comments } = useReelComments(showComments ? currentReel?.id || '' : '');

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (open && videoRef.current && currentReel?.media_type === 'video') {
      videoRef.current.play().catch(() => {});
    }
  }, [open, currentIndex, currentReel]);

  const goToNext = useCallback(() => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowComments(false);
    }
  }, [currentIndex, reels.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowComments(false);
    }
  }, [currentIndex]);

  const handleLike = useCallback(() => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    if (currentReel.is_liked) {
      unlikeReel.mutate(currentReel.id);
    } else {
      likeReel.mutate({ reelId: currentReel.id, userId: currentReel.user_id });
      // Show heart animation
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  }, [user, currentReel, likeReel, unlikeReel]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (!currentReel.is_liked) {
        handleLike();
      } else {
        // Show heart animation even if already liked
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
      }
    }
    lastTapRef.current = now;
  }, [currentReel?.is_liked, handleLike]);

  const handleFollow = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    if (isFollowing) {
      unfollowUser.mutate(currentReel.user_id);
    } else {
      followUser.mutate(currentReel.user_id);
      toast.success(`Following ${currentReel.profile?.full_name}`);
    }
  };

  const handleShare = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    setShowShareDialog(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      await createComment.mutateAsync({
        reelId: currentReel.id,
        content: commentText.trim(),
        reelUserId: currentReel.user_id,
      });
      setCommentText('');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      goToPrev();
    } else if (e.key === 'ArrowDown') {
      goToNext();
    } else if (e.key === 'Escape') {
      if (showComments) {
        setShowComments(false);
      } else {
        onOpenChange(false);
      }
    } else if (e.key === 'l' || e.key === 'L') {
      handleLike();
    } else if (e.key === 'm' || e.key === 'M') {
      setIsMuted(!isMuted);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (showComments) return;
    if (e.deltaY > 0) {
      goToNext();
    } else {
      goToPrev();
    }
  };

  if (!currentReel) return null;

  const isOwnReel = user?.id === currentReel.user_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-none w-screen h-screen p-0 bg-black border-0 rounded-none"
          onKeyDown={handleKeyDown}
        >
          <div 
            ref={containerRef}
            className="relative w-full h-full flex"
            onWheel={handleWheel}
          >
            {/* Main Content */}
            <div className={cn(
              "relative flex-1 flex items-center justify-center transition-all duration-300",
              showComments && "mr-80"
            )}>
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation Buttons */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hidden md:flex"
                  onClick={goToPrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronUp className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hidden md:flex"
                  onClick={goToNext}
                  disabled={currentIndex === reels.length - 1}
                >
                  <ChevronDown className="h-8 w-8" />
                </Button>
              </div>

              {/* Media Container */}
              <div 
                className="relative w-full h-full max-w-md mx-auto flex items-center"
                onClick={handleDoubleTap}
              >
                {currentReel.media_type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={currentReel.media_url}
                    className="w-full h-full object-contain"
                    loop
                    playsInline
                    muted={isMuted}
                    autoPlay
                    poster={currentReel.thumbnail_url || undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current?.paused) {
                        videoRef.current.play();
                      } else {
                        videoRef.current?.pause();
                      }
                    }}
                  />
                ) : (
                  <img
                    src={currentReel.media_url}
                    alt="Reel"
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Double Tap Heart Animation */}
                <AnimatePresence>
                  {showHeart && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Heart className="h-24 w-24 text-white fill-white drop-shadow-lg" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Overlay Content */}
                <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar 
                      className="h-10 w-10 ring-2 ring-white cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChange(false);
                        navigate(`/user/${currentReel.profile?.username}`);
                      }}
                    >
                      <AvatarImage src={currentReel.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {currentReel.profile?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-semibold text-white cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChange(false);
                          navigate(`/user/${currentReel.profile?.username}`);
                        }}
                      >
                        {currentReel.profile?.full_name}
                      </p>
                      <p className="text-sm text-white/70">@{currentReel.profile?.username}</p>
                    </div>
                    {/* Follow Button */}
                    {!isOwnReel && user && (
                      <Button
                        variant={isFollowing ? "secondary" : "default"}
                        size="sm"
                        className="gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow();
                        }}
                        disabled={followUser.isPending || unfollowUser.isPending}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Caption */}
                  {currentReel.caption && (
                    <p className="text-white text-sm line-clamp-2">{currentReel.caption}</p>
                  )}
                </div>

                {/* Side Actions */}
                <div className="absolute right-4 bottom-20 flex flex-col gap-6">
                  <button
                    className="flex flex-col items-center gap-1 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike();
                    }}
                  >
                    <Heart className={cn(
                      "h-8 w-8 transition-all",
                      currentReel.is_liked && "fill-red-500 text-red-500 scale-110"
                    )} />
                    <span className="text-xs font-medium">{currentReel.likes_count || 0}</span>
                  </button>
                  
                  <button
                    className="flex flex-col items-center gap-1 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowComments(!showComments);
                    }}
                  >
                    <MessageCircle className="h-8 w-8" />
                    <span className="text-xs font-medium">{currentReel.comments_count || 0}</span>
                  </button>
                  
                  <button
                    className="flex flex-col items-center gap-1 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                  >
                    <Share2 className="h-8 w-8" />
                    <span className="text-xs font-medium">Share</span>
                  </button>

                  {currentReel.media_type === 'video' && (
                    <button
                      className="flex flex-col items-center gap-1 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                    >
                      {isMuted ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
                    </button>
                  )}
                </div>

                {/* Progress Indicators */}
                <div className="absolute top-4 left-4 right-16 flex gap-1">
                  {reels.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors cursor-pointer",
                        idx === currentIndex ? "bg-white" : "bg-white/30"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Comments Panel */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ x: 320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 320, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border flex flex-col"
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">Comments</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowComments(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {comments?.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">
                          No comments yet. Be the first!
                        </p>
                      ) : (
                        comments?.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.profile?.avatar_url || ''} />
                              <AvatarFallback>{comment.profile?.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-sm">{comment.profile?.username}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {user && (
                    <form onSubmit={handleSubmitComment} className="p-4 border-t flex gap-2">
                      <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!commentText.trim() || createComment.isPending}
                      >
                        {createComment.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <AuthPromptDialog 
        open={showAuthPrompt} 
        onOpenChange={setShowAuthPrompt}
        title="Sign in to continue"
        description="Please sign in to interact with reels."
      />

      <ShareReelDialog 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog}
        reelId={currentReel.id}
      />
    </>
  );
}
