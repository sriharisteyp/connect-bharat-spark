import { useConversations } from '@/hooks/useMessages';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnlineStatus, AvatarOnlineIndicator } from '@/components/OnlineStatus';
import { ConversationSkeleton } from '@/components/ui/skeleton-loaders';

export default function MessagesPage() {
  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: friends, isLoading: friendsLoading } = useFriends();

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Messages</h1>

      <Tabs defaultValue="chats" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chats" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="friends" className="gap-2">
            <Users className="h-4 w-4" />
            Friends
          </TabsTrigger>
        </TabsList>

        {/* Chats Tab */}
        <TabsContent value="chats" className="mt-4">
          {conversationsLoading ? (
            <ConversationSkeleton />
          ) : !conversations || conversations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm">Start a conversation by visiting someone's profile!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <Link key={conversation.user_id} to={`/messages/${conversation.user_id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conversation.avatar_url || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conversation.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <AvatarOnlineIndicator userId={conversation.user_id} />
                      </div>
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
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends" className="mt-4">
          {friendsLoading ? (
            <ConversationSkeleton />
          ) : !friends || friends.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No friends yet</p>
                <p className="text-sm">Follow people to see them here!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <Link key={friend.user_id} to={`/messages/${friend.user_id}`}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={friend.avatar_url || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {friend.full_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <AvatarOnlineIndicator userId={friend.user_id} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{friend.full_name}</p>
                        <OnlineStatus userId={friend.user_id} showText size="sm" />
                      </div>
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
