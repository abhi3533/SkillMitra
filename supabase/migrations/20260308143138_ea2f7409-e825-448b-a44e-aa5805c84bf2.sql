
-- Fix the two "always true" RLS warnings:
-- 1. trainer_availability: Public read with USING (true) - this is SELECT so it's fine per linter
-- 2. contact_messages: Anyone insert with WITH CHECK (true) - tighten this
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) <= 100 AND
  length(email) <= 255 AND
  length(message) <= 5000 AND
  length(subject) <= 200
);
