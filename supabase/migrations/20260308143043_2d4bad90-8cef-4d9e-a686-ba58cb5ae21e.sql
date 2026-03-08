
-- Fix trainers: Re-create without WITH CHECK for SELECT
DROP POLICY IF EXISTS "Public read approved trainers safe" ON public.trainers;
CREATE POLICY "Public read approved trainers safe"
ON public.trainers
FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved');
