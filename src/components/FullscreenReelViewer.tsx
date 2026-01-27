import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Heart, MessageCircle, Share2, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { useLikeReel, useUnlikeReel, Reel } from '@/hooks/useReels';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const likeReel = useLikeReel();
  const unlikeReel = useUnlikeReel();

  const currentReel = reels[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (open && videoRef.current && currentReel?.media_type === 'video') {
      videoRef.current.play().catch(() => {});
    }
  }, [open, currentIndex, currentReel]);

  const goToNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like reels');
      return;
    }
    if (currentReel.is_liked) {
      unlikeReel.mutate(currentReel.id);
    } else {
      likeReel.mutate({ reelId: currentReel.id, userId: currentReel.user_id });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      goToPrev();
    } else if (e.key === 'ArrowDown') {
      goToNext();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      goToNext();
    } else {
      goToPrev();
    }
  };

  if (!currentReel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 bg-black border-0 rounded-none"
        onKeyDown={handleKeyDown}
      >
        <div 
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center"
          onWheel={handleWheel}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 left-4 z-50 text-white hover:bg-white/20 hidden md:flex"
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronUp className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1/2 -translate-y-1/2 left-4 z-50 text-white hover:bg-white/20 translate-y-8 hidden md:flex"
            onClick={goToNext}
            disabled={currentIndex === reels.length - 1}
          >
            <ChevronDown className="h-8 w-8" />
          </Button>

          {/* Media Container */}
          <div className="relative w-full h-full max-w-md mx-auto flex items-center">
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
                onClick={() => {
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

            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              {/* User Info */}
              <div 
                className="flex items-center gap-3 mb-4 cursor-pointer"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/user/${currentReel.profile?.username}`);
                }}
              >
                <Avatar className="h-10 w-10 ring-2 ring-white">
                  <AvatarImage src={currentReel.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {currentReel.profile?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{currentReel.profile?.full_name}</p>
                  <p className="text-sm text-white/70">@{currentReel.profile?.username}</p>
                </div>
              </div>

              {/* Caption */}
              {currentReel.caption && (
                <p className="text-white text-sm mb-4 line-clamp-3">{currentReel.caption}</p>
              )}
            </div>

            {/* Side Actions */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-12 w-12"
                onClick={handleLike}
              >
                <div className="flex flex-col items-center">
                  <Heart className={cn("h-7 w-7", currentReel.is_liked && "fill-red-500 text-red-500")} />
                  <span className="text-xs mt-1">{currentReel.likes_count || 0}</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-12 w-12"
              >
                <div className="flex flex-col items-center">
                  <MessageCircle className="h-7 w-7" />
                  <span className="text-xs mt-1">{currentReel.comments_count || 0}</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-12 w-12"
              >
                <Share2 className="h-7 w-7" />
              </Button>
              {currentReel.media_type === 'video' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-12 w-12"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
                </Button>
              )}
            </div>

            {/* Progress Indicators */}
            <div className="absolute top-4 left-4 right-16 flex gap-1">
              {reels.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    idx === currentIndex ? "bg-white" : "bg-white/30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
