import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notification permission denied');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [permission]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id || permission !== 'granted') return;

    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const notification = payload.new as {
            actor_id: string;
            type: string;
            message_preview: string | null;
          };

          // Get actor's profile
          const { data: actor } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', notification.actor_id)
            .single();

          const actorName = actor?.full_name || 'Someone';

          let title = 'New Notification';
          let body = '';

          switch (notification.type) {
            case 'like':
              title = 'New Like';
              body = `${actorName} liked your post`;
              break;
            case 'comment':
              title = 'New Comment';
              body = `${actorName} commented on your post`;
              break;
            case 'follow':
              title = 'New Follower';
              body = `${actorName} started following you`;
              break;
            case 'message':
              title = 'New Message';
              body = notification.message_preview 
                ? `${actorName}: ${notification.message_preview.substring(0, 50)}...`
                : `${actorName} sent you a message`;
              break;
          }

          showNotification(title, { body });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const message = payload.new as {
            sender_id: string;
            content: string;
          };

          // Get sender's profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', message.sender_id)
            .single();

          const senderName = sender?.full_name || 'Someone';
          const preview = message.content.startsWith('http') 
            ? 'Sent a media file'
            : message.content.substring(0, 50);

          showNotification(`Message from ${senderName}`, {
            body: preview,
            tag: `message-${message.sender_id}`, // Prevent duplicate notifications
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, permission, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
}

// Hook for in-app toast notifications that slide in
export function useInAppNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('in-app-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const message = payload.new as {
            sender_id: string;
            content: string;
          };

          // Get sender's profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', message.sender_id)
            .single();

          const senderName = sender?.full_name || 'Someone';
          const isMedia = message.content.startsWith('http');
          const preview = isMedia ? '📷 Sent a photo' : message.content.substring(0, 60);

          // Show toast notification that slides in from the right
          toast.message(senderName, {
            description: preview,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = `/messages/${message.sender_id}`;
              },
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
