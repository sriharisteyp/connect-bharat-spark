import { useState } from 'react';
import { REACTIONS, ReactionGroup } from '@/hooks/useMessageReactions';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

interface MessageReactionsProps {
  messageId: string;
  reactions: ReactionGroup[];
  onToggleReaction: (messageId: string, reaction: string) => void;
  isOwn: boolean;
}

export function MessageReactions({ messageId, reactions, onToggleReaction, isOwn }: MessageReactionsProps) {
  return (
    <div className={cn('flex items-center gap-1 flex-wrap mt-1', isOwn ? 'justify-end' : 'justify-start')}>
      {reactions.map((r) => (
        <button
          key={r.reaction}
          onClick={() => onToggleReaction(messageId, r.reaction)}
          className={cn(
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors border',
            r.hasReacted
              ? 'bg-primary/20 border-primary/40 text-foreground'
              : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground'
          )}
        >
          <span>{r.reaction}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
      <ReactionPicker messageId={messageId} onToggleReaction={onToggleReaction} />
    </div>
  );
}

export function ReactionPicker({ messageId, onToggleReaction }: { messageId: string; onToggleReaction: (messageId: string, reaction: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
          <SmilePlus className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5" side="top" align="center">
        <div className="flex gap-1">
          {REACTIONS.map((r) => (
            <button
              key={r}
              onClick={() => { onToggleReaction(messageId, r); setOpen(false); }}
              className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
            >
              {r}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function InlineReactionPicker({ messageId, onToggleReaction }: { messageId: string; onToggleReaction: (messageId: string, reaction: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted">
          <SmilePlus className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5" side="top" align="center">
        <div className="flex gap-1">
          {REACTIONS.map((r) => (
            <button
              key={r}
              onClick={() => { onToggleReaction(messageId, r); setOpen(false); }}
              className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
            >
              {r}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
