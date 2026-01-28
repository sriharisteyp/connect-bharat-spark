import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, BellRing, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { isSupported, permission, requestPermission } = usePushNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('You will now receive push notifications for new messages and activity');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when you receive new messages or when someone interacts with your posts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported ? (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in this browser
            </p>
          </div>
        ) : permission === 'granted' ? (
          <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
            <BellRing className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">Notifications Enabled</p>
              <p className="text-xs text-muted-foreground">
                You'll receive notifications for new messages and activity
              </p>
            </div>
          </div>
        ) : permission === 'denied' ? (
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
            <BellOff className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Notifications Blocked</p>
              <p className="text-xs text-muted-foreground">
                Please enable notifications in your browser settings
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Enable Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Get alerts on your device when someone messages you or interacts with your content
                </p>
              </div>
            </div>
            <Button onClick={handleEnableNotifications} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Message Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when you receive a message</p>
            </div>
            <Switch checked={permission === 'granted'} disabled />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Like Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when someone likes your post</p>
            </div>
            <Switch checked={permission === 'granted'} disabled />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Comment Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when someone comments</p>
            </div>
            <Switch checked={permission === 'granted'} disabled />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Follower Notifications</Label>
              <p className="text-xs text-muted-foreground">Get notified when someone follows you</p>
            </div>
            <Switch checked={permission === 'granted'} disabled />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
