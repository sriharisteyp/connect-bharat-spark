import { Home, Search, Bell, MessageCircle, User, Settings, LogOut, Video } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useUnreadMessagesCount } from '@/hooks/useMessages';
import { usePendingFriendRequestsCount } from '@/hooks/useFriendRequests';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Video, label: 'Reels', path: '/reels' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: unreadNotifications } = useUnreadNotificationsCount();
  const { data: unreadMessages } = useUnreadMessagesCount();
  const { data: pendingRequests } = usePendingFriendRequestsCount();

  const getBadgeCount = (path: string) => {
    if (path === '/notifications') return (unreadNotifications || 0) + (pendingRequests || 0);
    if (path === '/messages') return unreadMessages || 0;
    return 0;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 lg:w-20 bg-card border-r border-border flex flex-col items-center py-4 z-40">
      {/* Logo */}
      <Link to="/" className="mb-6">
        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-hero flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg lg:text-xl">L</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-2 w-full px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const badgeCount = getBadgeCount(item.path);

          return (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.path}
                  className={cn(
                    'relative w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <Separator className="my-2 w-10" />

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-2 px-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              className={cn(
                'w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all overflow-hidden',
                location.pathname === '/profile'
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                  : 'hover:ring-2 hover:ring-muted hover:ring-offset-2 hover:ring-offset-card'
              )}
            >
              <Avatar className="w-10 h-10 lg:w-12 lg:h-12">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Profile
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to="/settings"
              className={cn(
                'w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center transition-all',
                location.pathname === '/settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Settings className="w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Settings
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => signOut()}
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Sign Out
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
