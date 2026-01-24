import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import AuthPage from "@/pages/Auth";
import FeedPage from "@/pages/Feed";
import SearchPage from "@/pages/Search";
import NotificationsPage from "@/pages/Notifications";
import MessagesPage from "@/pages/Messages";
import ProfilePage from "@/pages/Profile";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<MainLayout><FeedPage /></MainLayout>} />
              <Route path="/search" element={<MainLayout><SearchPage /></MainLayout>} />
              <Route path="/notifications" element={<MainLayout><NotificationsPage /></MainLayout>} />
              <Route path="/messages" element={<MainLayout><MessagesPage /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
              <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
