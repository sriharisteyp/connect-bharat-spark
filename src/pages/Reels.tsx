import { useState, useRef } from 'react';
import { useReelsFeed, useFollowingReels, useCreateReel, useUploadReelMedia, Reel } from '@/hooks/useReels';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Plus, Loader2, Play, Image as ImageIcon, Video, Flame, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { AuthPromptDialog } from '@/components/AuthPromptDialog';
import { ReelGridSkeleton } from '@/components/ui/skeleton-loaders';

function ReelCard({ reel }: { reel: Reel }) {
  const navigate = useNavigate();

  return (
    <Card 
      className="overflow-hidden cursor-pointer group hover:ring-2 hover:ring-primary/50 transition-all"
      onClick={() => navigate(`/reels/${reel.id}`)}
    >
      <CardContent className="p-0">
        <AspectRatio ratio={9/16} className="bg-black relative">
          {reel.media_type === 'video' ? (
            <>
              <img 
                src={reel.thumbnail_url || reel.media_url} 
                alt="Reel" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="h-10 w-10 text-white opacity-80" fill="white" />
              </div>
            </>
          ) : (
            <img src={reel.media_url} alt="Reel" className="w-full h-full object-cover" />
          )}

          {/* Overlay info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reel.profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">{reel.profile?.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="text-white text-xs font-medium truncate">{reel.profile?.full_name}</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <span className="flex items-center gap-1">
                <Heart className={cn("h-3 w-3", reel.is_liked && "fill-current text-red-400")} /> {reel.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {reel.comments_count || 0}
              </span>
            </div>
          </div>
        </AspectRatio>
      </CardContent>
    </Card>
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
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    // Close dialog immediately for instant feel
    const captionValue = caption.trim();
    setOpen(false);
    toast.info('Uploading reel...');

    try {
      const mediaUrl = await uploadMedia.mutateAsync(file);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      await createReel.mutateAsync({
        mediaUrl,
        mediaType,
        caption: captionValue || undefined,
      });

      toast.success('Reel posted!');
      setFile(null);
      setPreview(null);
      setCaption('');
    } catch {
      toast.error('Failed to create reel');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Reel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Reel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

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
                <p className="text-sm text-muted-foreground">Click to upload a photo or video</p>
              </div>
            </div>
          )}

          <Textarea placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />

          <div className="flex gap-2">
            {preview && (
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Change Media
              </Button>
            )}
            <Button className="flex-1" onClick={handleSubmit} disabled={!file}>
              Post Reel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ReelsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trending' | 'following'>('trending');
  const { data: trendingData, isLoading: trendingLoading, fetchNextPage: fetchTrendingNext, hasNextPage: hasTrendingNext, isFetchingNextPage: isFetchingTrending } = useReelsFeed();
  const { data: followingData, isLoading: followingLoading, fetchNextPage: fetchFollowingNext, hasNextPage: hasFollowingNext, isFetchingNextPage: isFetchingFollowing } = useFollowingReels();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const trendingReels = trendingData?.pages.flat() || [];
  const followingReels = followingData?.pages.flat() || [];

  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reels</h1>
          <p className="text-muted-foreground">Discover trending videos and photos</p>
        </div>
        {user ? (
          <CreateReelDialog />
        ) : (
          <Button className="gap-2" onClick={() => setShowAuthPrompt(true)}>
            <Plus className="h-4 w-4" />
            Create Reel
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'trending' | 'following')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trending" className="gap-2">
            <Flame className="h-4 w-4" /> Trending
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <Users className="h-4 w-4" /> Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="mt-4">
          {trendingLoading ? (
            <ReelGridSkeleton />
          ) : trendingReels.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No reels yet</h3>
                <p className="text-muted-foreground">Be the first to share a reel!</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {trendingReels.map((reel) => (
                  <ReelCard key={reel.id} reel={reel} />
                ))}
              </div>
              {hasTrendingNext && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => fetchTrendingNext()} disabled={isFetchingTrending}>
                    {isFetchingTrending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-4">
          {!user ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Sign in to see reels from people you follow</h3>
              </CardContent>
            </Card>
          ) : followingLoading ? (
            <ReelGridSkeleton />
          ) : followingReels.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No reels from people you follow</h3>
                <p className="text-muted-foreground">Start following people to see their reels here!</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {followingReels.map((reel) => (
                  <ReelCard key={reel.id} reel={reel} />
                ))}
              </div>
              {hasFollowingNext && (
                <div className="text-center mt-4">
                  <Button variant="outline" onClick={() => fetchFollowingNext()} disabled={isFetchingFollowing}>
                    {isFetchingFollowing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <AuthPromptDialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt} title="Sign in to continue" description="Please sign in to create reels." />
    </div>
  );
}
