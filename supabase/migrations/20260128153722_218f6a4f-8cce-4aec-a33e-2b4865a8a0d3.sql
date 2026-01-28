-- Create stories table for 24-hour content
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Stories RLS policies
CREATE POLICY "Stories are viewable by everyone" 
ON public.stories FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Users can create their own stories" 
ON public.stories FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories FOR DELETE 
USING (auth.uid() = user_id);

-- Create user_presence table
CREATE TABLE public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- User presence RLS policies
CREATE POLICY "Presence is viewable by everyone" 
ON public.user_presence FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own presence" 
ON public.user_presence FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence" 
ON public.user_presence FOR UPDATE 
USING (auth.uid() = user_id);

-- Create story_views table to track who viewed stories
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS on story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Story views RLS policies
CREATE POLICY "Users can view story views for their own stories" 
ON public.story_views FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.stories WHERE stories.id = story_id AND stories.user_id = auth.uid()) OR viewer_id = auth.uid());

CREATE POLICY "Users can create story views" 
ON public.story_views FOR INSERT 
WITH CHECK (auth.uid() = viewer_id);

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Create index for faster queries
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);