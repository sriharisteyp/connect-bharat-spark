import { useState, useRef } from 'react';
import { useFeedPosts, useCreatePost, useLikePost, useUnlikePost, useDeletePost } from '@/hooks/usePosts';
import { useUploadPostImage } from '@/hooks/usePostImages';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Heart, MessageCircle, Image, Loader2, X, ChevronDown, ChevronUp, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PostComments } from '@/components/PostComments';
import { Stories } from '@/components/Stories';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FeedPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: postsData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedPosts();
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  const uploadImage = useUploadPostImage();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const posts = postsData?.pages.flat() || [];

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedImage) return;
    
    try {
      let imageUrl: string | undefined;
      
      if (selectedImage) {
        imageUrl = await uploadImage.mutateAsync(selectedImage);
      }
      
      await createPost.mutateAsync({ content: content.trim(), imageUrl });
      setContent('');
      removeImage();
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const handleLike = async (postId: string, userId: string, isLiked: boolean) => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }
    try {
      if (isLiked) {
        await unlikePost.mutateAsync(postId);
      } else {
        await likePost.mutateAsync({ postId, userId });
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const isPosting = createPost.isPending || uploadImage.isPending;

  return (
    <div className="space-y-4">
      {/* Stories */}
      <Card>
        <Stories />
      </Card>

      {/* Create Post */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="resize-none min-h-[80px]"
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-48 rounded-lg object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPosting}
                >
                  <Image className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button 
                  onClick={handlePost} 
                  disabled={(!content.trim() && !selectedImage) || isPosting}
                >
                  {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Posts Feed */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No posts yet. Be the first to share something!
          </CardContent>
        </Card>
      ) : (
        <>
          {posts.map((post) => (
            <Card key={post.id} className="animate-fade-in">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Link to={`/user/${post.profile?.username}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {post.profile?.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${post.profile?.username}`} className="font-semibold hover:underline">
                      {post.profile?.full_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      @{post.profile?.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {/* Delete option for own posts */}
                  {user && post.user_id === user.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DeleteConfirmDialog
                          title="Delete Post"
                          description="Are you sure you want to delete this post? This action cannot be undone."
                          onConfirm={() => handleDeletePost(post.id)}
                          isPending={deletePost.isPending}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                {post.image_url && (
                  <img src={post.image_url} alt="Post" className="rounded-lg w-full max-h-96 object-cover mb-4" />
                )}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleLike(post.id, post.user_id, post.is_liked || false)}
                    className={cn(
                      'flex items-center gap-2 text-sm transition-colors',
                      post.is_liked ? 'text-accent' : 'text-muted-foreground hover:text-accent'
                    )}
                  >
                    <Heart className={cn('h-5 w-5', post.is_liked && 'fill-current')} />
                    {post.likes_count || 0}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {post.comments_count || 0}
                    {expandedComments.has(post.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Comments Section */}
                <Collapsible open={expandedComments.has(post.id)}>
                  <CollapsibleContent className="mt-4 pt-4 border-t">
                    <PostComments postId={post.id} postUserId={post.user_id} />
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
          {hasNextPage && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load More'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
