import { 
  usePendingFriendRequests, 
  useAcceptFriendRequest, 
  useRejectFriendRequest 
} from '@/hooks/useFriendRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function PendingFriendRequests() {
  const navigate = useNavigate();
  const { data: requests, isLoading } = usePendingFriendRequests();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Friend Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center gap-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer"
              onClick={() => navigate(`/user/${request.sender?.username}`)}
            >
              <AvatarImage src={request.sender?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {request.sender?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p 
                className="font-medium truncate cursor-pointer hover:underline"
                onClick={() => navigate(`/user/${request.sender?.username}`)}
              >
                {request.sender?.full_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={() => {
                  acceptRequest.mutate(request.id, {
                    onSuccess: () => toast.success('Friend request accepted!'),
                    onError: () => toast.error('Failed to accept'),
                  });
                }}
                disabled={acceptRequest.isPending}
              >
                {acceptRequest.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <UserCheck className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  rejectRequest.mutate(request.id, {
                    onSuccess: () => toast.success('Request rejected'),
                    onError: () => toast.error('Failed to reject'),
                  });
                }}
                disabled={rejectRequest.isPending}
              >
                {rejectRequest.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
