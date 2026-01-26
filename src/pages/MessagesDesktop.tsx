import { useState, useRef, useEffect } from 'react';
import { useAcceptedFriends } from '@/hooks/useFriendRequests';
import { useConversations, useConversationMessages, useSendMessage, useMarkMessagesAsRead, Message } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, MessageCircle, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Friend {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface Conversation {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

function FriendsList({ 
  friends, 
  selectedUserId, 
  onSelectFriend 
}: { 
  friends: Friend[]; 
  selectedUserId: string | null;
  onSelectFriend: (userId: string) => void;
}) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No friends yet</p>
        <p className="text-sm">Send friend requests to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {friends.map((friend) => (
        <div
          key={friend.user_id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
            selectedUserId === friend.user_id 
              ? "bg-primary/10" 
              : "hover:bg-muted"
          )}
          onClick={() => onSelectFriend(friend.user_id)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={friend.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {friend.full_name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{friend.full_name}</p>
            <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationsList({ 
  conversations, 
  selectedUserId, 
  onSelectConversation 
}: { 
  conversations: Conversation[]; 
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No conversations yet</p>
        <p className="text-sm">Start a chat from Friends tab!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <div
          key={conv.user_id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
            selectedUserId === conv.user_id 
              ? "bg-primary/10" 
              : "hover:bg-muted"
          )}
          onClick={() => onSelectConversation(conv.user_id)}
        >
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conv.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {conv.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            {conv.unread_count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                {conv.unread_count}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium truncate">{conv.full_name}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
              </span>
            </div>
            <p className={cn(
              "text-sm truncate",
              conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {conv.last_message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatArea({ partnerId, partnerName, partnerAvatar }: { 
  partnerId: string; 
  partnerName: string;
  partnerAvatar: string | null;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useConversationMessages(partnerId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (partnerId && messages && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.receiver_id === user?.id && !m.is_read);
      if (unreadMessages.length > 0) {
        markAsRead.mutate(partnerId);
      }
    }
  }, [partnerId, messages, user?.id, markAsRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage.mutate(
      { receiverId: partnerId, content: message.trim() },
      { onSuccess: () => setMessage('') }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-10 w-10">
          <AvatarImage src={partnerAvatar || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {partnerName?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{partnerName}</p>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Say hello to {partnerName}!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-2',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={cn(
                      'text-xs mt-1',
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!message.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyChatState() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <h3 className="text-lg font-medium">Select a chat</h3>
        <p className="text-sm">Choose a friend or conversation to start messaging</p>
      </div>
    </div>
  );
}

export default function MessagesDesktopPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ name: string; avatar: string | null } | null>(null);

  const { data: friends = [], isLoading: friendsLoading } = useAcceptedFriends();
  const { data: conversations = [], isLoading: convsLoading } = useConversations();

  const handleSelectFriend = (userId: string) => {
    const friend = friends.find(f => f.user_id === userId);
    if (friend) {
      setSelectedUserId(userId);
      setSelectedUser({ name: friend.full_name, avatar: friend.avatar_url });
    }
  };

  const handleSelectConversation = (userId: string) => {
    const conv = conversations.find(c => c.user_id === userId);
    if (conv) {
      setSelectedUserId(userId);
      setSelectedUser({ name: conv.full_name, avatar: conv.avatar_url });
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4">
      {/* Left Panel - Friends & Conversations */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="pb-2">
          <h2 className="text-lg font-semibold">Messages</h2>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <Tabs defaultValue="chats" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mb-2">
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
              <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chats" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full px-2">
                {convsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                ) : (
                  <ConversationsList 
                    conversations={conversations} 
                    selectedUserId={selectedUserId}
                    onSelectConversation={handleSelectConversation}
                  />
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="friends" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full px-2">
                {friendsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                ) : (
                  <FriendsList 
                    friends={friends} 
                    selectedUserId={selectedUserId}
                    onSelectFriend={handleSelectFriend}
                  />
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Right Panel - Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {selectedUserId && selectedUser ? (
          <ChatArea 
            partnerId={selectedUserId} 
            partnerName={selectedUser.name}
            partnerAvatar={selectedUser.avatar}
          />
        ) : (
          <EmptyChatState />
        )}
      </Card>
    </div>
  );
}
