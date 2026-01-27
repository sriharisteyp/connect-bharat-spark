import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConversationMessages, useSendMessage, useMarkMessagesAsRead } from '@/hooks/useMessages';
import { useProfileByUserId } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { VoiceMessageRecorder } from '@/components/VoiceMessageRecorder';
import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';

// Check if content is a voice message URL
function isVoiceMessage(content: string): boolean {
  return content.includes('/storage/v1/object/public/posts/') && content.endsWith('.webm');
}

export default function ChatPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: partner, isLoading: partnerLoading } = useProfileByUserId(partnerId || '');
  const { data: messages, isLoading: messagesLoading } = useConversationMessages(partnerId || '');
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
  }, [partnerId, messages, user?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !partnerId) return;

    sendMessage.mutate(
      { receiverId: partnerId, content: message.trim() },
      { onSuccess: () => setMessage('') }
    );
  };

  const handleSendVoice = (audioUrl: string) => {
    if (!partnerId) return;
    sendMessage.mutate({ receiverId: partnerId, content: audioUrl });
  };

  if (partnerLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-2rem)]">
      {/* Header */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={partner?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {partner?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{partner?.full_name || 'Unknown User'}</p>
              <p className="text-sm text-muted-foreground truncate">@{partner?.username}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 rounded-none overflow-hidden">
        <CardContent className="h-full overflow-y-auto p-4 space-y-3">
          {messagesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Say hello to {partner?.full_name}!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const isVoice = isVoiceMessage(msg.content);
              
              return (
                <div
                  key={msg.id}
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    )}
                  >
                    {isVoice ? (
                      <VoiceMessagePlayer audioUrl={msg.content} isOwn={isOwn} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <p className={cn(
                      'text-xs mt-1',
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="py-3">
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <VoiceMessageRecorder 
              onSend={handleSendVoice} 
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
        </CardContent>
      </Card>
    </div>
  );
}