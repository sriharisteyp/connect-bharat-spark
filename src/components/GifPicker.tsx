import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';

interface GifPickerProps {
  onGifSelected: (gifUrl: string) => void;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

// Using Tenor API (free, no key required for limited use) via a proxy approach
// We'll use a curated set approach with search via giphy's embed URLs
const TRENDING_GIFS = [
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDRyMnJ4MjFhbGRiMGRyY2VmYmVtbDR4OXNtZmJyMnRranRkOCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0HlvtIPdJRr5Acqk/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmZhdmNkZHR4NXBtZTBjM3NyeHRlcDBmMHR6dGl3OWZkOGp6ZCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKoMK4nGpFFMYSI/giphy.gif',
  'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExczJscXNyNjd5MTdvcjJ6ZTFsN3c5NXF6cTl3M3FjYnY2NmlyZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26u4cqiYI30juCOGY/giphy.gif',
];

export function GifPicker({ onGifSelected, disabled, trigger }: GifPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSelect = (url: string) => {
    onGifSelected(url);
    setOpen(false);
    setSearch('');
  };

  // We'll use Giphy's oEmbed/search via their public API
  const [gifs, setGifs] = useState<string[]>(TRENDING_GIFS);
  const [loading, setLoading] = useState(false);

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGifs(TRENDING_GIFS);
      return;
    }
    setLoading(true);
    try {
      // Use Giphy's public beta API key (for demo/dev use)
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=20&rating=g`
      );
      const data = await res.json();
      const urls = data.data?.map((g: any) => g.images?.fixed_height?.url).filter(Boolean) || [];
      setGifs(urls);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debounceRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    debounceRef.current = setTimeout(() => searchGifs(search), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, searchGifs]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="ghost" size="icon" disabled={disabled} title="Send GIF">
            <span className="text-lg font-bold text-muted-foreground">GIF</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Send a GIF</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search GIFs..." 
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-64">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : gifs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No GIFs found</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-1">
              {gifs.map((url, i) => (
                <button
                  key={i}
                  className="rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => handleSelect(url)}
                >
                  <img src={url} alt="GIF" className="w-full h-24 object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <p className="text-xs text-muted-foreground text-center">Powered by GIPHY</p>
      </DialogContent>
    </Dialog>
  );
}
