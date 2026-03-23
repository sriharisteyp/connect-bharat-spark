import { useState, useRef, useEffect, useCallback } from 'react';
import { useAcceptedFriends } from '@/hooks/useFriendRequests';
import { useConversations, useConversationMessages, useSendMessage, useMarkMessagesAsRead, Message } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Loader2, MessageCircle, Users, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { OnlineStatus, AvatarOnlineIndicator } from '@/components/OnlineStatus';
import { ConversationSkeleton, ChatMessageSkeleton } from '@/components/ui/skeleton-loaders';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
import { ChatImageUpload } from '@/components/ChatImageUpload';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useTypingIndicator, useTypingSubscription } from '@/hooks/usePresence';
import { GroupChatPanel } from '@/components/GroupChatPanel';
import { GifPicker } from '@/components/GifPicker';

function isVoiceMessage(content: string): boolean {
  return content.includes('/storage/v1/object/public/posts/') && content.endsWith('.webm');
}

function isImageMessage(content: string): boolean {
  return (content.includes('/storage/v1/object/public/posts/') && 
    (content.endsWith('.jpg') || content.endsWith('.jpeg') || content.endsWith('.png') || content.endsWith('.gif') || content.endsWith('.webp')));
}

function isGifMessage(content: string): boolean {
  return content.includes('giphy.com') || content.includes('tenor.com');
}

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

function FriendsList({ friends, selectedUserId, onSelectFriend }: { friends: Friend[]; selectedUserId: string | null; onSelectFriend: (userId: string) => void }) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No friends yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {friends.map((friend) => (
        <div
          key={friend.user_id}
          className={cn("flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors", selectedUserId === friend.user_id ? "bg-primary/10" : "hover:bg-muted")}
          onClick={() => onSelectFriend(friend.user_id)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">{friend.full_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <AvatarOnlineIndicator userId={friend.user_id} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{friend.full_name}</p>
            <OnlineStatus userId={friend.user_id} showText size="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationsList({ conversations, selectedUserId, onSelectConversation }: { conversations: Conversation[]; selectedUserId: string | null; onSelectConversation: (userId: string) => void }) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <div
          key={conv.user_id}
          className={cn("flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors", selectedUserId === conv.user_id ? "bg-primary/10" : "hover:bg-muted")}
          onClick={() => onSelectConversation(conv.user_id)}
        >
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conv.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">{conv.full_name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            {conv.unread_count > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">{conv.unread_count}</span>
            )}
            <AvatarOnlineIndicator userId={conv.user_id} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium truncate">{conv.full_name}</p>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}</span>
            </div>
            <p className={cn("text-sm truncate", conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>{conv.last_message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatArea({ partnerId, partnerName, partnerAvatar }: { partnerId: string; partnerName: string; partnerAvatar: string | null }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages, isLoading } = useConversationMessages(partnerId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();
  const { setTyping } = useTypingIndicator(partnerId);
  const isPartnerTyping = useTypingSubscription(partnerId);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = useCallback((value: string) => {
    setMessage(value);
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
  }, [setTyping]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (partnerId && messages && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.receiver_id === user?.id && !m.is_read);
      if (unreadMessages.length > 0) markAsRead.mutate(partnerId);
    }
  }, [partnerId, messages, user?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendMessage.mutate({ receiverId: partnerId, content: message.trim() }, { onSuccess: () => setMessage('') });
  };

  const handleSendVoice = (audioUrl: string) => sendMessage.mutate({ receiverId: partnerId, content: audioUrl });
  const handleSendImage = (imageUrl: string) => sendMessage.mutate({ receiverId: partnerId, content: imageUrl });
  const handleSendGif = (gifUrl: string) => sendMessage.mutate({ receiverId: partnerId, content: gifUrl });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={partnerAvatar || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">{partnerName?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <AvatarOnlineIndicator userId={partnerId} />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{partnerName}</p>
          <OnlineStatus userId={partnerId} showText size="sm" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <ChatMessageSkeleton />
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
              const isVoice = isVoiceMessage(msg.content);
              const isImage = isImageMessage(msg.content);
              return (
                <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[70%] rounded-2xl px-4 py-2', isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md')}>
                    {isVoice ? (
                      <VoiceMessagePlayer audioUrl={msg.content} isOwn={isOwn} />
                    ) : isImage ? (
                      <img src={msg.content} alt="Shared image" className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer" onClick={() => window.open(msg.content, '_blank')} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <p className={cn('text-xs mt-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            {isPartnerTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <TypingIndicator isTyping={true} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <ChatImageUpload onImageSelected={handleSendImage} disabled={sendMessage.isPending} />
          <GifPicker onGifSelected={handleSendGif} disabled={sendMessage.isPending} />
          <Input value={message} onChange={(e) => handleInputChange(e.target.value)} placeholder="Type a message..." className="flex-1" disabled={sendMessage.isPending} />
          <VoiceMessageRecorder onSend={handleSendVoice} disabled={sendMessage.isPending} />
          <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EmptyChatState() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/20">
      <div className="text-center">
        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <h3 className="text-lg font-medium">Select a chat</h3>
        <p className="text-sm">Choose a friend or conversation to start messaging</p>
      </div>
    </div>
  );
}

type ViewMode = 'dm' | 'group';

export default function MessagesDesktopPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('dm');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ name: string; avatar: string | null } | null>(null);

  const { data: friends = [], isLoading: friendsLoading } = useAcceptedFriends();
  const { data: conversations = [], isLoading: convsLoading } = useConversations();

  const handleSelectFriend = (userId: string) => {
    const friend = friends.find(f => f.user_id === userId);
    if (friend) {
      setSelectedUserId(userId);
      setSelectedUser({ name: friend.full_name, avatar: friend.avatar_url });
      setViewMode('dm');
    }
  };

  const handleSelectConversation = (userId: string) => {
    const conv = conversations.find(c => c.user_id === userId);
    if (conv) {
      setSelectedUserId(userId);
      setSelectedUser({ name: conv.full_name, avatar: conv.avatar_url });
      setViewMode('dm');
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel */}
      <div className="w-80 border-r flex flex-col bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="chats" className="flex-1 flex flex-col">
            <TabsList className="mx-4 my-2">
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
              <TabsTrigger value="groups" className="flex-1">Groups</TabsTrigger>
              <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chats" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full px-2">
                {convsLoading ? <ConversationSkeleton /> : (
                  <ConversationsList conversations={conversations} selectedUserId={viewMode === 'dm' ? selectedUserId : null} onSelectConversation={handleSelectConversation} />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="groups" className="flex-1 m-0 overflow-hidden">
              <div className="h-full" onClick={() => setViewMode('group')}>
                <ScrollArea className="h-full">
                  <GroupChatPanel />
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="friends" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full px-2">
                {friendsLoading ? <ConversationSkeleton /> : (
                  <FriendsList friends={friends} selectedUserId={viewMode === 'dm' ? selectedUserId : null} onSelectFriend={handleSelectFriend} />
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === 'dm' && selectedUserId && selectedUser ? (
          <ChatArea partnerId={selectedUserId} partnerName={selectedUser.name} partnerAvatar={selectedUser.avatar} />
        ) : viewMode === 'group' ? (
          <div className="h-full">
            <GroupChatPanel />
          </div>
        ) : (
          <EmptyChatState />
        )}
      </div>
    </div>
  );
}
