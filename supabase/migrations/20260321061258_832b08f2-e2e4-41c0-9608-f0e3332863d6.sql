
-- Tighten the group_members insert policy - only allow the auto-join function (SECURITY DEFINER) or self-insertion
DROP POLICY "System can insert members" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
