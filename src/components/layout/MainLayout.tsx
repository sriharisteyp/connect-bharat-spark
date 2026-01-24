import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Home, Search, Bell, MessageCircle, User, Settings, LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import { useUnreadMessagesCount } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const { data: unreadNotifications = 0 } = useUnreadNotificationsCount();
  const { data: unreadMessages = 0 } = useUnreadMessagesCount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadNotifications },
    { icon: MessageCircle, label: 'Messages', path: '/messages', badge: unreadMessages },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative tap-highlight-none',
          isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <item.icon className="h-5 w-5" />
        <span className="hidden md:inline">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <span className="absolute top-2 left-7 md:left-auto md:right-3 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 border-r border-border bg-card flex-col p-4">
        <Link to="/" className="text-xl font-bold text-primary mb-8 px-4">DesiConnect</Link>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>
        <div className="border-t border-border pt-4 space-y-1">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50 safe-top">
        <Link to="/" className="text-lg font-bold text-primary">DesiConnect</Link>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <nav className="space-y-1 mt-8">
              {navItems.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50 safe-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center h-full px-4 relative tap-highlight-none',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-2xs mt-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-2xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-2xl mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
