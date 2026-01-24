import { useConversations } from '@/hooks/useMessages';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { data: conversations, isLoading } = useConversations();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No messages yet. Start a conversation by visiting someone's profile!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Card key={conversation.user_id} className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="py-3 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={conversation.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {conversation.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{conversation.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                    </p>
                  </div>
                  <p className={cn('text-sm truncate', conversation.unread_count > 0 ? 'font-semibold' : 'text-muted-foreground')}>
                    {conversation.last_message}
                  </p>
                </div>
                {conversation.unread_count > 0 && (
                  <span className="bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {conversation.unread_count}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
