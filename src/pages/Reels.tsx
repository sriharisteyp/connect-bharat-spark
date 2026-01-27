import { useState, useRef } from 'react';
import { useReelsFeed, useCreateReel, useUploadReelMedia, useLikeReel, useUnlikeReel, Reel } from '@/hooks/useReels';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Heart, MessageCircle, Share2, Plus, Loader2, Play, Image as ImageIcon, Video, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { FullscreenReelViewer } from '@/components/FullscreenReelViewer';
import { ReelComments } from '@/components/ReelComments';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import { ShareReelDialog } from '@/components/ShareReelDialog';

interface ReelCardProps {
  reel: Reel;
  reels: Reel[];
  index: number;
  onOpenFullscreen: (index: number) => void;
}

function ReelCard({ reel, reels, index, onOpenFullscreen }: ReelCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const likeReel = useLikeReel();
  const unlikeReel = useUnlikeReel();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLike = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    if (reel.is_liked) {
      unlikeReel.mutate(reel.id);
    } else {
      likeReel.mutate({ reelId: reel.id, userId: reel.user_id });
    }
  };

  const handleShare = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    setShowShareDialog(true);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <Card className="overflow-hidden group">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center gap-3 p-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer"
              onClick={() => navigate(`/user/${reel.profile?.username}`)}
            >
              <AvatarImage src={reel.profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {reel.profile?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p 
                className="font-semibold truncate cursor-pointer hover:underline"
                onClick={() => navigate(`/user/${reel.profile?.username}`)}
              >
                {reel.profile?.full_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onOpenFullscreen(index)}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Media */}
          <AspectRatio ratio={9/16} className="bg-black cursor-pointer" onClick={() => onOpenFullscreen(index)}>
            {reel.media_type === 'video' ? (
              <div className="relative w-full h-full" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
                <video
                  ref={videoRef}
                  src={reel.media_url}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted
                  poster={reel.thumbnail_url || undefined}
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="h-16 w-16 text-white" fill="white" />
                  </div>
                )}
              </div>
            ) : (
              <img 
                src={reel.media_url} 
                alt="Reel" 
                className="w-full h-full object-cover"
              />
            )}
          </AspectRatio>

          {/* Actions */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={handleLike}
              >
                <Heart className={cn("h-5 w-5", reel.is_liked && "fill-current text-accent")} />
                <span>{reel.likes_count || 0}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-5 w-5" />
                <span>{reel.comments_count || 0}</span>
                {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {reel.caption && (
              <p className="text-sm">
                <span className="font-semibold mr-2">{reel.profile?.username}</span>
                {reel.caption}
              </p>
            )}

            {/* Comments Section */}
            <Collapsible open={showComments}>
              <CollapsibleContent className="pt-3 border-t mt-3">
                <ReelComments reelId={reel.id} reelUserId={reel.user_id} />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      <AuthPromptDialog 
        open={showAuthPrompt} 
        onOpenChange={setShowAuthPrompt}
        title="Sign in to continue"
        description="Please sign in to like, comment, or share reels."
      />

      <ShareReelDialog 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog}
        reelId={reel.id}
      />
    </>
  );
}

function CreateReelDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMedia = useUploadReelMedia();
  const createReel = useCreateReel();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      const mediaUrl = await uploadMedia.mutateAsync(file);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      await createReel.mutateAsync({
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
      });

      toast.success('Reel created successfully!');
      setOpen(false);
      setFile(null);
      setPreview(null);
      setCaption('');
    } catch (error) {
      toast.error('Failed to create reel');
    }
  };

  const isLoading = uploadMedia.isPending || createReel.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Reel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Reel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {preview ? (
            <AspectRatio ratio={9/16} className="bg-muted rounded-lg overflow-hidden">
              {file?.type.startsWith('video/') ? (
                <video src={preview} className="w-full h-full object-cover" controls />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              )}
            </AspectRatio>
          ) : (
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to upload a photo or video
                </p>
              </div>
            </div>
          )}

          <Textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2">
            {preview && (
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Change Media
              </Button>
            )}
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={!file || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Post Reel'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ReelsPage() {
  const { user } = useAuth();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useReelsFeed();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const reels = data?.pages.flat() || [];

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setFullscreenOpen(true);
  };

  const handleCreateClick = () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reels</h1>
          <p className="text-muted-foreground">Discover trending videos and photos</p>
        </div>
        {user ? (
          <CreateReelDialog />
        ) : (
          <Button className="gap-2" onClick={handleCreateClick}>
            <Plus className="h-4 w-4" />
            Create Reel
          </Button>
        )}
      </div>

      {/* Reels Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      ) : reels.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No reels yet</h3>
            <p className="text-muted-foreground">Be the first to share a reel!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reels.map((reel, index) => (
            <ReelCard 
              key={reel.id} 
              reel={reel} 
              reels={reels}
              index={index}
              onOpenFullscreen={openFullscreen}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Load More
          </Button>
        </div>
      )}

      {/* Fullscreen Viewer */}
      <FullscreenReelViewer
        reels={reels}
        initialIndex={fullscreenIndex}
        open={fullscreenOpen}
        onOpenChange={setFullscreenOpen}
      />

      {/* Auth Prompt */}
      <AuthPromptDialog 
        open={showAuthPrompt} 
        onOpenChange={setShowAuthPrompt}
        title="Sign in to create"
        description="Please sign in to create and share reels."
      />
    </div>
  );
}
