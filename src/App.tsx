import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import ChatLayout from "@/components/layout/ChatLayout";
import MessagesLayout from "@/components/layout/MessagesLayout";
import LandingPage from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import FeedPage from "@/pages/Feed";
import SearchPage from "@/pages/Search";
import NotificationsPage from "@/pages/Notifications";
import MessagesPage from "@/pages/Messages";
import MessagesDesktopPage from "@/pages/MessagesDesktop";
import ChatPage from "@/pages/Chat";
import ProfilePage from "@/pages/Profile";
import UserProfilePage from "@/pages/UserProfile";
import SettingsPage from "@/pages/Settings";
import AboutPage from "@/pages/About";
import ReelsPage from "@/pages/Reels";
import ReelViewPage from "@/pages/ReelView";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrackPresence } from "@/hooks/usePresence";
import { useInAppNotifications } from "@/hooks/usePushNotifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  },
});

// Component to track presence and enable in-app notifications
function AppInitializer({ children }: { children: React.ReactNode }) {
  useTrackPresence();
  useInAppNotifications();
  return <>{children}</>;
}

// Home route that shows landing for guests, feed for authenticated users
function HomeRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <LandingPage />;
  }
  
  return <MainLayout><FeedPage /></MainLayout>;
}

// Messages route that shows desktop or mobile layout based on screen size
function MessagesRoute() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MessagesLayout><MessagesPage /></MessagesLayout>;
  }
  
  return <MessagesLayout><MessagesDesktopPage /></MessagesLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppInitializer>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/feed" element={<MainLayout><FeedPage /></MainLayout>} />
                <Route path="/search" element={<MainLayout><SearchPage /></MainLayout>} />
                <Route path="/notifications" element={<MainLayout><NotificationsPage /></MainLayout>} />
                <Route path="/messages" element={<MessagesRoute />} />
                <Route path="/messages/:partnerId" element={<ChatLayout><ChatPage /></ChatLayout>} />
                <Route path="/reels" element={<MainLayout><ReelsPage /></MainLayout>} />
                <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
                <Route path="/user/:username" element={<MainLayout><UserProfilePage /></MainLayout>} />
                <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
                <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppInitializer>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
