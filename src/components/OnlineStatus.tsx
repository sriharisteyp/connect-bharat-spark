import { useUserPresence } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OnlineStatusProps {
  userId: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineStatus({ userId, showText = false, size = 'sm', className }: OnlineStatusProps) {
  const { data: presence } = useUserPresence(userId);

  const isOnline = presence?.is_online || false;

  const dotSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full border-2 border-background",
          dotSizes[size],
          isOnline ? "bg-green-500" : "bg-muted-foreground/40"
        )}
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {isOnline 
            ? 'Online' 
            : presence?.last_seen 
              ? `Last seen ${formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}`
              : 'Offline'
          }
        </span>
      )}
    </div>
  );
}

// Positioned indicator for avatars
interface AvatarOnlineIndicatorProps {
  userId: string;
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

export function AvatarOnlineIndicator({ userId, position = 'bottom-right' }: AvatarOnlineIndicatorProps) {
  const { data: presence } = useUserPresence(userId);

  if (!presence?.is_online) return null;

  const positionClasses = {
    'bottom-right': 'bottom-0 right-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-left': 'top-0 left-0',
  };

  return (
    <span
      className={cn(
        "absolute w-3 h-3 bg-green-500 rounded-full border-2 border-background",
        positionClasses[position]
      )}
    />
  );
}
