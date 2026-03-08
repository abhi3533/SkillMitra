CREATE TABLE public.ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (guests too)
CREATE POLICY "Anyone can insert chat sessions" ON public.ai_chat_sessions
  FOR INSERT WITH CHECK (true);

-- Users can read their own sessions
CREATE POLICY "Users read own chat sessions" ON public.ai_chat_sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own sessions
CREATE POLICY "Users update own chat sessions" ON public.ai_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins manage all
CREATE POLICY "Admins manage chat sessions" ON public.ai_chat_sessions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));