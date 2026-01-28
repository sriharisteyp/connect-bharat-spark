import { useState, useRef, useEffect } from 'react';
import { useStories, useCreateStory, useUploadStoryMedia, useViewStory, useDeleteStory, StoryGroup, Story } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Loader2, X, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

// Story Circle Component
function StoryCircle({ group, onClick, isOwn }: { group: StoryGroup; onClick: () => void; isOwn?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1 min-w-[72px]"
    >
      <div className={cn(
        "w-16 h-16 rounded-full p-0.5",
        group.has_unviewed 
          ? "bg-gradient-to-tr from-primary to-accent" 
          : "bg-muted"
      )}>
        <div className="w-full h-full rounded-full bg-background p-0.5">
          <Avatar className="w-full h-full">
            <AvatarImage src={group.profile.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {group.profile.full_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <span className="text-xs truncate max-w-[72px]">
        {isOwn ? 'Your story' : group.profile.full_name.split(' ')[0]}
      </span>
    </button>
  );
}

// Add Story Button
function AddStoryButton() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMedia = useUploadStoryMedia();
  const createStory = useCreateStory();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      const mediaUrl = await uploadMedia.mutateAsync(file);
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      await createStory.mutateAsync({
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
      });

      toast.success('Story posted!');
      setOpen(false);
      setFile(null);
      setPreview(null);
      setCaption('');
    } catch (error) {
      toast.error('Failed to post story');
    }
  };

  const isLoading = uploadMedia.isPending || createStory.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center gap-1 min-w-[72px]">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-xs">Add story</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
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
            <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
              {file?.type.startsWith('video/') ? (
                <video src={preview} className="w-full h-full object-contain" controls />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="aspect-[9/16] border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Plus className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Click to add photo or video</p>
              </div>
            </div>
          )}

          <Input
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />

          <Button className="w-full" onClick={handleSubmit} disabled={!file || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Share Story'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Story Viewer Dialog
function StoryViewer({ 
  groups, 
  initialGroupIndex, 
  open, 
  onOpenChange 
}: { 
  groups: StoryGroup[]; 
  initialGroupIndex: number; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const viewStory = useViewStory();
  const deleteStory = useDeleteStory();

  const currentGroup = groups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwnStory = currentStory?.user_id === user?.id;

  useEffect(() => {
    setCurrentGroupIndex(initialGroupIndex);
    setCurrentStoryIndex(0);
  }, [initialGroupIndex]);

  useEffect(() => {
    if (!open || !currentStory) return;

    // Mark story as viewed
    if (!currentStory.has_viewed && user && currentStory.user_id !== user.id) {
      viewStory.mutate(currentStory.id);
    }

    // Progress timer
    const duration = currentStory.media_type === 'video' ? 15000 : 5000;
    const interval = 50;
    let elapsed = 0;

    setProgress(0);
    progressInterval.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        goToNext();
      }
    }, interval);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [open, currentGroupIndex, currentStoryIndex, currentStory?.id]);

  const goToNext = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      onOpenChange(false);
    }
  };

  const goToPrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentStoryIndex(groups[currentGroupIndex - 1].stories.length - 1);
    }
  };

  const handleDelete = async () => {
    if (!currentStory) return;
    
    try {
      await deleteStory.mutateAsync(currentStory.id);
      toast.success('Story deleted');
      
      if (currentGroup.stories.length === 1) {
        onOpenChange(false);
      } else {
        goToNext();
      }
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-black border-0 rounded-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-16 flex gap-1 z-50">
            {currentGroup.stories.map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{
                    width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute top-10 left-4 z-50 flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-white">
              <AvatarImage src={currentGroup.profile.avatar_url || ''} />
              <AvatarFallback>{currentGroup.profile.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold text-sm">{currentGroup.profile.full_name}</p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Delete button for own stories */}
          {isOwnStory && (
            <div className="absolute top-10 right-16 z-50 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Eye className="h-4 w-4 mr-1" />
                {currentStory.view_count || 0}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/20 hover:text-red-400"
                onClick={handleDelete}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Navigation buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20"
            onClick={goToPrev}
            disabled={currentGroupIndex === 0 && currentStoryIndex === 0}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Media */}
          <div 
            className="w-full h-full max-w-md mx-auto flex items-center justify-center"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 2) {
                goToPrev();
              } else {
                goToNext();
              }
            }}
          >
            {currentStory.media_type === 'video' ? (
              <video
                ref={videoRef}
                src={currentStory.media_url}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <img
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-8 left-4 right-4 z-40">
              <p className="text-white text-center bg-black/50 rounded-lg px-4 py-2">
                {currentStory.caption}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Stories Component
export function Stories() {
  const { user } = useAuth();
  const { data: storyGroups, isLoading } = useStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  const openStory = (index: number) => {
    setSelectedGroupIndex(index);
    setViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-muted" />
            <div className="w-12 h-3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex gap-4 p-4">
          {user && <AddStoryButton />}
          
          {storyGroups?.map((group, index) => (
            <StoryCircle
              key={group.user_id}
              group={group}
              isOwn={group.user_id === user?.id}
              onClick={() => openStory(index)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {storyGroups && storyGroups.length > 0 && (
        <StoryViewer
          groups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
        />
      )}
    </>
  );
}
