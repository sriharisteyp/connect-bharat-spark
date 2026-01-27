import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Copy, Check, Share2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareReelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reelId: string;
}

export function ShareReelDialog({ open, onOpenChange, reelId }: ShareReelDialogProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/reels?reel=${reelId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this reel!',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Reel
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={shareUrl} 
                readOnly 
                className="pl-10 pr-4"
              />
            </div>
            <Button onClick={handleCopy} size="icon" variant="outline">
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {'share' in navigator && (
            <Button onClick={handleNativeShare} className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              Share via...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
