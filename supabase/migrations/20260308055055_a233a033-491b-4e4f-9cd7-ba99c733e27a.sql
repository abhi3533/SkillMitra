CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _referral_code text;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role);
  INSERT INTO public.profiles (id, full_name, email, phone, city, state, gender, language_preference) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'gender',
    CASE 
      WHEN NEW.raw_user_meta_data->'language_preference' IS NOT NULL 
        AND jsonb_typeof(NEW.raw_user_meta_data->'language_preference') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'language_preference'))
      ELSE '{}'::text[]
    END
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  IF _role = 'student'::app_role THEN
    _referral_code := 'SM-' || upper(substr(md5(random()::text), 1, 6));
    INSERT INTO public.students (user_id, referral_code, trainer_gender_preference) VALUES (
      NEW.id, 
      _referral_code,
      COALESCE(NEW.raw_user_meta_data->>'trainer_gender_preference', 'no_preference')
    );
  END IF;
  IF _role = 'trainer'::app_role THEN
    INSERT INTO public.trainers (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;