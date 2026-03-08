
-- Remove public SELECT policies from trainers and profiles tables
-- Public access will ONLY go through security-definer RPC functions

DROP POLICY IF EXISTS "Public read approved trainers safe" ON public.trainers;
DROP POLICY IF EXISTS "Public read verified profiles safe" ON public.profiles;
