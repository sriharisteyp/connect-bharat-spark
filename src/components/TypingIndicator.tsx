import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isTyping: boolean;
  name?: string;
  className?: string;
}

export function TypingIndicator({ isTyping, name, className }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{name ? `${name} is typing...` : 'Typing...'}</span>
    </div>
  );
}
