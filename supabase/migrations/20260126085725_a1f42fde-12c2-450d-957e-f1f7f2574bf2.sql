-- Create friend_requests table for explicit friend request system
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Policies for friend_requests
CREATE POLICY "Users can view their own friend requests"
ON public.friend_requests
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update friend request status"
ON public.friend_requests
FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Sender can delete pending requests"
ON public.friend_requests
FOR DELETE
USING (auth.uid() = sender_id AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create reels table for short videos and photos
CREATE TABLE public.reels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'image')),
  thumbnail_url TEXT,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- Policies for reels
CREATE POLICY "Reels are viewable by everyone"
ON public.reels
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reels"
ON public.reels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reels"
ON public.reels
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels"
ON public.reels
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reels_updated_at
BEFORE UPDATE ON public.reels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create reel_likes table
CREATE TABLE public.reel_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(reel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

-- Policies for reel_likes
CREATE POLICY "Reel likes are viewable by everyone"
ON public.reel_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can like reels"
ON public.reel_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike reels"
ON public.reel_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create reel_comments table
CREATE TABLE public.reel_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reel_id UUID NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

-- Policies for reel_comments
CREATE POLICY "Reel comments are viewable by everyone"
ON public.reel_comments
FOR SELECT
USING (true);

CREATE POLICY "Users can create reel comments"
ON public.reel_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel comments"
ON public.reel_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for reels
INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true);

-- Storage policies for reels bucket
CREATE POLICY "Reel media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'reels');

CREATE POLICY "Users can upload reel media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their reel media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their reel media"
ON storage.objects FOR DELETE
USING (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);