
-- Add new columns to ratings table for detailed two-way ratings
ALTER TABLE public.ratings 
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.course_sessions(id),
ADD COLUMN IF NOT EXISTS student_teaching_quality integer,
ADD COLUMN IF NOT EXISTS student_punctuality_rating integer,
ADD COLUMN IF NOT EXISTS student_communication_rating integer,
ADD COLUMN IF NOT EXISTS student_review_text text,
ADD COLUMN IF NOT EXISTS trainer_to_student_punctuality integer,
ADD COLUMN IF NOT EXISTS trainer_to_student_preparation integer,
ADD COLUMN IF NOT EXISTS trainer_to_student_engagement integer,
ADD COLUMN IF NOT EXISTS trainer_to_student_communication integer,
ADD COLUMN IF NOT EXISTS trainer_private_notes text,
ADD COLUMN IF NOT EXISTS student_rated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS trainer_rated_at timestamp with time zone;

-- Drop old columns that overlap (rename existing ones)
-- Keep student_to_trainer_rating, student_to_trainer_review (already exist)
-- Keep trainer_to_student_rating, trainer_to_student_review (already exist)
-- Keep technical_score, communication_score, punctuality_score (already exist)

-- Add foreign key from trainers to profiles via user_id
-- We need a view or just fix queries. Actually let's add a direct FK.
-- trainers.user_id references auth.users(id), profiles.id references auth.users(id)
-- So we can't add a direct FK trainers→profiles. Instead we fix queries.
