
-- Fix group_members INSERT policy: allow self-insert without subquery RLS issues
DROP POLICY IF EXISTS "Admins can add members" ON public.group_members;

CREATE POLICY "Users can add members"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR
  public.is_group_admin(auth.uid(), group_id)
);

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by message participants"
ON public.message_reactions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can add reactions"
ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.message_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Also create group_message_reactions table
CREATE TABLE public.group_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by authenticated"
ON public.group_message_reactions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can add reactions"
ON public.group_message_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.group_message_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);
