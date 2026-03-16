
-- Fix the security definer view warning - drop it since we use RPC functions instead
DROP VIEW IF EXISTS public.public_ratings;
