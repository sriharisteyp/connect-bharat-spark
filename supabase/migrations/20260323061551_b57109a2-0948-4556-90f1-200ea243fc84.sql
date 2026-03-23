
-- Allow group creation by authenticated users
DROP POLICY IF EXISTS "Members can view groups" ON public.group_chats;
DROP POLICY IF EXISTS "Members can update group info" ON public.group_chats;

-- Allow authenticated users to create groups
CREATE POLICY "Authenticated users can create groups"
ON public.group_chats FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Members can view their groups
CREATE POLICY "Members can view groups"
ON public.group_chats FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_chats.id AND group_members.user_id = auth.uid()));

-- Only admins can update group info
CREATE POLICY "Admins can update group info"
ON public.group_chats FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_chats.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'));

-- Admins can delete groups
CREATE POLICY "Admins can delete groups"
ON public.group_chats FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM group_members WHERE group_members.group_id = group_chats.id AND group_members.user_id = auth.uid() AND group_members.role = 'admin'));

-- Allow admins to add members
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

CREATE POLICY "Admins can add members"
ON public.group_members FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  OR auth.uid() = user_id
);

-- Allow admins to remove members or user to leave
CREATE POLICY "Admins can remove members or self leave"
ON public.group_members FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
  OR auth.uid() = user_id
);

-- Allow admins to update member roles
CREATE POLICY "Admins can update member roles"
ON public.group_members FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'));

-- Update members view policy to not be recursive
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;

-- Create security definer function to check membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id AND role = 'admin'
  )
$$;

CREATE POLICY "Members can view group members v2"
ON public.group_members FOR SELECT TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

-- Remove the default group and auto-join trigger
DROP TRIGGER IF EXISTS on_profile_created_join_groups ON public.profiles;
DROP FUNCTION IF EXISTS public.auto_join_default_groups();

-- Delete existing default group data
DELETE FROM public.group_messages WHERE group_id IN (SELECT id FROM public.group_chats WHERE is_default = true);
DELETE FROM public.group_members WHERE group_id IN (SELECT id FROM public.group_chats WHERE is_default = true);
DELETE FROM public.group_chats WHERE is_default = true;
