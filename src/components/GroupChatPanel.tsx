import { useState, useRef, useEffect } from 'react';
import { useGroupChats, useGroupMessages, useSendGroupMessage, useUpdateGroupChat, useGroupMembers, GroupChat } from '@/hooks/useGroupChat';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, Loader2, Users, Settings, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function GroupSettings({ group }: { group: GroupChat }) {
  const [name, setName] = useState(group.name);
  const [open, setOpen] = useState(false);
  const updateGroup = useUpdateGroupChat();
  const { data: members } = useGroupMembers(group.id);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateGroup.mutateAsync({ groupId: group.id, name: name.trim() });
      toast.success('Group updated!');
      setOpen(false);
    } catch {
      toast.error('Failed to update group');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={updateGroup.isPending} className="w-full">
            {updateGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
          <div>
            <p className="text-sm font-medium mb-2">Members ({members?.length || 0})</p>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {members?.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {m.profile?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{m.profile?.full_name || 'Unknown'}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupChatMessages({ group }: { group: GroupChat }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages, isLoading } = useGroupMessages(group.id);
  const sendMessage = useSendGroupMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate(
      { groupId: group.id, content: message.trim() },
      { onSuccess: () => setMessage('') }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Avatar className="h-10 w-10">
          {group.avatar_url ? (
            <AvatarImage src={group.avatar_url} />
          ) : null}
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Hash className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{group.name}</p>
          <p className="text-xs text-muted-foreground">{group.member_count} members</p>
        </div>
        <GroupSettings group={group} />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div className="flex gap-2 max-w-[70%]">
                    {!isOwn && (
                      <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                        <AvatarImage src={msg.sender?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {msg.sender?.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      {!isOwn && (
                        <p className="text-xs font-medium text-primary mb-0.5">
                          {msg.sender?.full_name || 'Unknown'}
                        </p>
                      )}
                      <div className={cn(
                        'rounded-2xl px-4 py-2',
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn(
                          'text-xs mt-1',
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
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

export function GroupChatPanel() {
  const { data: groups, isLoading } = useGroupChats();
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  // Auto-select first group
  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No groups yet</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Group list (if multiple) */}
      {groups.length > 1 && (
        <div className="border-b p-2 space-y-1">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g)}
              className={cn(
                'w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left',
                selectedGroup?.id === g.id ? 'bg-primary/10' : 'hover:bg-muted'
              )}
            >
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{g.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">{g.member_count}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Chat area */}
      {selectedGroup ? (
        <div className="flex-1 overflow-hidden">
          <GroupChatMessages group={selectedGroup} />
        </div>
      ) : null}
    </div>
  );
}
