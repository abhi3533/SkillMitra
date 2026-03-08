
-- Fix the remaining always-true: ai_chat_sessions insert policy was already replaced
-- Check which policy is the issue - likely it's the trainer_availability public read
-- That's a SELECT with USING (true) which the linter says is excluded.
-- Let's check if it's the ai_chat_sessions one that was already fixed in migration above.
-- The previous migration already created a new one with proper check.
-- The remaining one is likely from a different table. Let's just verify.

-- Actually let's also tighten the ai_chat_sessions insert from earlier migration
-- (The earlier migration may not have run since the trainers one failed)
DROP POLICY IF EXISTS "Anyone can insert chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Anyone can insert chat sessions"
ON public.ai_chat_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);
