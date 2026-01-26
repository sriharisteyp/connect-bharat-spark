import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus, Mail, Loader2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { PendingFriendRequests } from '@/components/PendingFriendRequests';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-accent" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-primary" />;
      case 'follow': return <UserPlus className="h-4 w-4 text-primary" />;
      case 'message': return <Mail className="h-4 w-4 text-primary" />;
      case 'friend_request': return <Users className="h-4 w-4 text-primary" />;
      case 'friend_accepted': return <Users className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  const getMessage = (type: string, actorName: string) => {
    switch (type) {
      case 'like': return `${actorName} liked your post`;
      case 'comment': return `${actorName} commented on your post`;
      case 'follow': return `${actorName} started following you`;
      case 'message': return `${actorName} sent you a message`;
      case 'friend_request': return `${actorName} sent you a friend request`;
      case 'friend_accepted': return `${actorName} accepted your friend request`;
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications && notifications.some(n => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Pending Friend Requests */}
      <PendingFriendRequests />

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No notifications yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className={cn(!notification.is_read && 'bg-muted/50')}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={notification.actor?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {notification.actor?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5">
                    {getIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">{getMessage(notification.type, notification.actor?.full_name || 'Someone')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
