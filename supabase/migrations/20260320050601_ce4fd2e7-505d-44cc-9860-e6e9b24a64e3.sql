
CREATE OR REPLACE FUNCTION public.sync_trainer_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.profile_status = 'approved' AND NEW.course_status = 'approved' THEN
    NEW.trainer_status := 'live';
  ELSE
    NEW.trainer_status := 'inactive';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_trainer_status
  BEFORE UPDATE OF profile_status, course_status ON public.trainers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_trainer_status();
