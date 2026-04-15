DROP FUNCTION IF EXISTS public.get_public_trainer_profile(uuid);

CREATE FUNCTION public.get_public_trainer_profile(trainer_row_id uuid)
 RETURNS TABLE(trainer_id uuid, trainer_user_id uuid, trainer_bio text, trainer_skills text[], trainer_experience_years integer, trainer_current_company text, trainer_current_role text, trainer_teaching_languages text[], trainer_average_rating numeric, trainer_total_students integer, trainer_approval_status text, trainer_intro_video_url text, trainer_linkedin_url text, trainer_previous_companies text[], trainer_boost_score integer, trainer_subscription_plan text, trainer_is_job_seeker boolean, trainer_hide_photo boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    t.id, t.user_id, t.bio, t.skills, t.experience_years,
    t.current_company, t."current_role", t.teaching_languages,
    t.average_rating, t.total_students, t.approval_status,
    t.intro_video_url, t.linkedin_url, t.previous_companies,
    t.boost_score, t.subscription_plan, t.is_job_seeker, t.hide_photo
  FROM public.trainers t
  WHERE t.id = trainer_row_id AND t.trainer_status = 'live';
$function$;