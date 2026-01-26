import { Button } from '@/components/ui/button';
import { 
  useFriendRequestStatus, 
  useSendFriendRequest, 
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useAreFriends
} from '@/hooks/useFriendRequests';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, UserPlus, UserCheck, Clock, X, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FriendRequestButtonProps {
  userId: string;
  showMessageButton?: boolean;
}

export function FriendRequestButton({ userId, showMessageButton = true }: FriendRequestButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: requestStatus, isLoading: statusLoading } = useFriendRequestStatus(userId);
  const { data: areFriends, isLoading: friendsLoading } = useAreFriends(userId);

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();

  if (!user || user.id === userId) return null;

  if (statusLoading || friendsLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // Already friends
  if (areFriends) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" disabled className="gap-2">
          <UserCheck className="h-4 w-4" />
          Friends
        </Button>
        {showMessageButton && (
          <Button 
            variant="default" 
            className="gap-2"
            onClick={() => navigate(`/messages/${userId}`)}
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>
        )}
      </div>
    );
  }

  // No request exists - show "Add Friend" button
  if (!requestStatus || requestStatus.status === 'rejected') {
    return (
      <Button
        variant="default"
        className="gap-2"
        onClick={() => {
          sendRequest.mutate(userId, {
            onSuccess: () => toast.success('Friend request sent!'),
            onError: () => toast.error('Failed to send request'),
          });
        }}
        disabled={sendRequest.isPending}
      >
        {sendRequest.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        Add Friend
      </Button>
    );
  }

  // Request pending - current user sent it
  if (requestStatus.status === 'pending' && requestStatus.sender_id === user.id) {
    return (
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => {
          cancelRequest.mutate(requestStatus.id, {
            onSuccess: () => toast.success('Request cancelled'),
            onError: () => toast.error('Failed to cancel request'),
          });
        }}
        disabled={cancelRequest.isPending}
      >
        {cancelRequest.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
        Request Sent
      </Button>
    );
  }

  // Request pending - current user received it
  if (requestStatus.status === 'pending' && requestStatus.receiver_id === user.id) {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          className="gap-2"
          onClick={() => {
            acceptRequest.mutate(requestStatus.id, {
              onSuccess: () => toast.success('Friend request accepted!'),
              onError: () => toast.error('Failed to accept request'),
            });
          }}
          disabled={acceptRequest.isPending}
        >
          {acceptRequest.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            rejectRequest.mutate(requestStatus.id, {
              onSuccess: () => toast.success('Request rejected'),
              onError: () => toast.error('Failed to reject request'),
            });
          }}
          disabled={rejectRequest.isPending}
        >
          {rejectRequest.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return null;
}
