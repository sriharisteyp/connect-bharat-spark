
-- Group chats table
CREATE TABLE public.group_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Group Chat',
  description text,
  avatar_url text,
  created_by uuid NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Group members table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group messages table
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS for group_chats
CREATE POLICY "Members can view groups" ON public.group_chats
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = group_chats.id AND group_members.user_id = auth.uid()));

CREATE POLICY "Members can update group info" ON public.group_chats
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = group_chats.id AND group_members.user_id = auth.uid()));

-- RLS for group_members
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()));

CREATE POLICY "System can insert members" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS for group_messages
CREATE POLICY "Members can view group messages" ON public.group_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = group_messages.group_id AND group_members.user_id = auth.uid()));

CREATE POLICY "Members can send group messages" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = group_messages.group_id AND group_members.user_id = auth.uid())
  );

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Create the default "CRACK HEADS" group
INSERT INTO public.group_chats (name, description, created_by, is_default)
VALUES ('CRACK HEADS', 'Welcome to Linko! This is the global community group where all members can chat.', '00000000-0000-0000-0000-000000000000', true);

-- Auto-join all existing users
INSERT INTO public.group_members (group_id, user_id, role)
SELECT gc.id, p.user_id, 'member'
FROM public.group_chats gc
CROSS JOIN public.profiles p
WHERE gc.is_default = true
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Function to auto-join new users to default groups
CREATE OR REPLACE FUNCTION public.auto_join_default_groups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  SELECT gc.id, NEW.user_id, 'member'
  FROM public.group_chats gc
  WHERE gc.is_default = true
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: auto-join on profile creation
CREATE TRIGGER on_profile_created_join_groups
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_join_default_groups();
