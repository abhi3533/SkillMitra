DROP FUNCTION IF EXISTS public.get_approved_trainers_list();

CREATE FUNCTION public.get_approved_trainers_list()
 RETURNS TABLE(trainer_id uuid, trainer_user_id uuid, trainer_bio text, trainer_skills text[], trainer_experience_years integer, trainer_current_company text, trainer_current_role text, trainer_teaching_languages text[], trainer_average_rating numeric, trainer_total_students integer, trainer_approval_status text, trainer_subscription_plan text, trainer_is_job_seeker boolean, trainer_boost_score integer, trainer_hide_photo boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT t.id, t.user_id, t.bio, t.skills, t.experience_years,
    t.current_company, t."current_role", t.teaching_languages,
    t.average_rating, t.total_students, t.approval_status,
    t.subscription_plan, t.is_job_seeker, t.boost_score, t.hide_photo
  FROM public.trainers t
  WHERE t.trainer_status = 'live';
$function$;