import { useState, useRef, useEffect } from 'react';
import { 
  useGroupChats, useGroupMessages, useSendGroupMessage, useUpdateGroupChat, 
  useGroupMembers, useCreateGroupChat, useAddGroupMember, useRemoveGroupMember,
  usePromoteToAdmin, useDemoteFromAdmin, useDeleteGroupChat,
  GroupChat, GroupMember 
} from '@/hooks/useGroupChat';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, Loader2, Users, Settings, Hash, Plus, UserPlus, Crown, Trash2, LogOut, Shield, ShieldOff, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function CreateGroupDialog({ onCreated }: { onCreated?: (group: GroupChat) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const createGroup = useCreateGroupChat();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const group = await createGroup.mutateAsync({ name: name.trim() });
      toast.success('Group created!');
      setOpen(false);
      setName('');
      onCreated?.(group as unknown as GroupChat);
    } catch {
      toast.error('Failed to create group');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 w-full">
          <Plus className="h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Group name..." 
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!name.trim() || createGroup.isPending} className="w-full">
            {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: friends = [] } = useFriends();
  const { data: members = [] } = useGroupMembers(groupId);
  const addMember = useAddGroupMember();

  const memberIds = new Set(members.map(m => m.user_id));
  const filteredFriends = friends.filter(f => 
    !memberIds.has(f.user_id) && 
    (f.full_name.toLowerCase().includes(search.toLowerCase()) || f.username.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (userId: string) => {
    try {
      await addMember.mutateAsync({ groupId, userId });
      toast.success('Member added!');
    } catch {
      toast.error('Failed to add member');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search friends..." />
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No friends to add</p>
            ) : filteredFriends.map(f => (
              <div key={f.user_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={f.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{f.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.full_name}</p>
                  <p className="text-xs text-muted-foreground">@{f.username}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAdd(f.user_id)} disabled={addMember.isPending}>
                  Add
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function GroupSettings({ group, onLeave }: { group: GroupChat; onLeave: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(group.name);
  const [open, setOpen] = useState(false);
  const updateGroup = useUpdateGroupChat();
  const deleteGroup = useDeleteGroupChat();
  const removeMember = useRemoveGroupMember();
  const promote = usePromoteToAdmin();
  const demote = useDemoteFromAdmin();
  const { data: members = [] } = useGroupMembers(group.id);

  const currentMember = members.find(m => m.user_id === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      await updateGroup.mutateAsync({ groupId: group.id, name: name.trim() });
      toast.success('Group updated!');
    } catch {
      toast.error('Failed to update group');
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeMember.mutateAsync({ groupId: group.id, userId });
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleLeave = async () => {
    try {
      await removeMember.mutateAsync({ groupId: group.id, userId: user!.id });
      toast.success('Left group');
      setOpen(false);
      onLeave();
    } catch {
      toast.error('Failed to leave group');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup.mutateAsync(group.id);
      toast.success('Group deleted');
      setOpen(false);
      onLeave();
    } catch {
      toast.error('Failed to delete group');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isAdmin && (
            <>
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <div className="flex gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} />
                  <Button onClick={handleSave} disabled={updateGroup.isPending} size="sm">Save</Button>
                </div>
              </div>
              <AddMemberDialog groupId={group.id} />
            </>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Members ({members.length})</p>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {m.profile?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{m.profile?.full_name || 'Unknown'}</p>
                      {m.role === 'admin' && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <Crown className="h-3 w-3" /> Admin
                        </span>
                      )}
                    </div>
                    {isAdmin && m.user_id !== user?.id && (
                      <div className="flex gap-1">
                        {m.role === 'admin' ? (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => demote.mutateAsync({ groupId: group.id, userId: m.user_id })} title="Remove admin">
                            <ShieldOff className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => promote.mutateAsync({ groupId: group.id, userId: m.user_id })} title="Make admin">
                            <Shield className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemove(m.user_id)} title="Remove">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t">
            <Button variant="outline" className="gap-2 text-destructive" onClick={handleLeave}>
              <LogOut className="h-4 w-4" /> Leave Group
            </Button>
            {isAdmin && (
              <Button variant="destructive" className="gap-2" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Delete Group
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupChatMessages({ group, onLeave }: { group: GroupChat; onLeave: () => void }) {
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
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Avatar className="h-10 w-10">
          {group.avatar_url ? <AvatarImage src={group.avatar_url} /> : null}
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Hash className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{group.name}</p>
          <p className="text-xs text-muted-foreground">{group.member_count} members</p>
        </div>
        <GroupSettings group={group} onLeave={onLeave} />
      </div>

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
                        isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn('text-xs mt-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
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
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function GroupChatPanel() {
  const { data: groups, isLoading } = useGroupChats();
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);

  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  // Reset selection if current group was deleted
  useEffect(() => {
    if (selectedGroup && groups && !groups.find(g => g.id === selectedGroup.id)) {
      setSelectedGroup(groups[0] || null);
    }
  }, [groups, selectedGroup]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b space-y-2">
        <CreateGroupDialog onCreated={(g) => setSelectedGroup(g)} />
        {groups && groups.length > 0 && (
          <div className="space-y-1">
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
      </div>
      
      {selectedGroup ? (
        <div className="flex-1 overflow-hidden">
          <GroupChatMessages group={selectedGroup} onLeave={() => setSelectedGroup(null)} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Create a group to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}
