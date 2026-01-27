import { useState } from 'react';
import { useReelComments, useCreateReelComment, ReelComment } from '@/hooks/useReels';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface ReelCommentsProps {
  reelId: string;
  reelUserId: string;
}

export function ReelComments({ reelId, reelUserId }: ReelCommentsProps) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useReelComments(reelId);
  const createComment = useCreateReelComment();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) {
      if (!user) toast.error('Please login to comment');
      return;
    }

    try {
      await createComment.mutateAsync({
        reelId,
        content: newComment.trim(),
        reelUserId,
      });
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Link to={`/user/${comment.profile?.username}`}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {comment.profile?.full_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Link to={`/user/${comment.profile?.username}`} className="font-semibold text-sm hover:underline">
                    {comment.profile?.full_name}
                  </Link>
                  <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "Add a comment..." : "Login to comment"}
          disabled={!user || createComment.isPending}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!user || !newComment.trim() || createComment.isPending}
        >
          {createComment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
