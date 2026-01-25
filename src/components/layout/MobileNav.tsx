import { Home, Search, Bell, MessageCircle, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useUnreadMessagesCount } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: MessageCircle, label: 'Chat', path: '/messages' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileNav() {
  const location = useLocation();
  const { data: unreadNotifications } = useUnreadNotificationsCount();
  const { data: unreadMessages } = useUnreadMessagesCount();

  const getBadgeCount = (path: string) => {
    if (path === '/notifications') return unreadNotifications || 0;
    if (path === '/messages') return unreadMessages || 0;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 safe-bottom md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const badgeCount = getBadgeCount(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all tap-highlight-none',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <item.icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
              {badgeCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </div>
            <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
