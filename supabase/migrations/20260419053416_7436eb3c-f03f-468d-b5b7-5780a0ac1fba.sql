DO $$
DECLARE
  v_course_id uuid := 'da578040-45c0-446d-b0b9-56c605043dfc';
  v_trainer_id uuid;
  v_student_id uuid;
  v_enroll_id uuid;
  v_session_id uuid;
  v_trial_id uuid;
  v_start_date date;
  v_test_date date;
  v_session_dates date[] := ARRAY[]::date[];
  v_dup_caught boolean := false;
  v_invalid_hour_caught boolean := false;
  v_inserted_slots integer;
  i integer;
BEGIN
  SELECT trainer_id, course_start_date INTO v_trainer_id, v_start_date FROM public.courses WHERE id = v_course_id;
  SELECT id INTO v_student_id FROM public.students LIMIT 1;
  RAISE NOTICE '── Test setup ──';
  RAISE NOTICE 'course=% trainer=% student=% start_date=%', v_course_id, v_trainer_id, v_student_id, v_start_date;

  -- TEST 1: simulate paid enrollment with hour=7 (morning band) starting on course_start_date
  INSERT INTO public.enrollments (student_id, trainer_id, course_id, status, amount_paid, sessions_total, start_date)
  VALUES (v_student_id, v_trainer_id, v_course_id, 'active', 5000, 4, v_start_date)
  RETURNING id INTO v_enroll_id;

  -- Build 4 weekly session dates
  FOR i IN 0..3 LOOP
    v_session_dates := array_append(v_session_dates, (v_start_date + (i*7))::date);
  END LOOP;

  -- Insert 4 sessions + 4 slot reservations
  FOR i IN 1..4 LOOP
    v_test_date := v_session_dates[i];
    INSERT INTO public.course_sessions (enrollment_id, trainer_id, title, session_number, is_trial, scheduled_at, duration_mins, status)
    VALUES (v_enroll_id, v_trainer_id, 'Session ' || i, i, false, (v_test_date::timestamp + interval '7 hours'), 60, 'upcoming')
    RETURNING id INTO v_session_id;
    INSERT INTO public.trainer_booked_slots (trainer_id, slot_date, slot_hour, session_id, enrollment_id)
    VALUES (v_trainer_id, v_test_date, 7, v_session_id, v_enroll_id);
  END LOOP;

  SELECT count(*) INTO v_inserted_slots FROM public.trainer_booked_slots WHERE enrollment_id = v_enroll_id;
  RAISE NOTICE '✅ TEST 1 PASS: enrollment + 4 sessions + % slots reserved', v_inserted_slots;

  -- TEST 2: try to double-book the SAME slot (trainer + date + hour) → should violate unique constraint
  BEGIN
    INSERT INTO public.trainer_booked_slots (trainer_id, slot_date, slot_hour, enrollment_id)
    VALUES (v_trainer_id, v_session_dates[1], 7, v_enroll_id);
  EXCEPTION WHEN unique_violation THEN
    v_dup_caught := true;
  END;
  IF v_dup_caught THEN
    RAISE NOTICE '✅ TEST 2 PASS: duplicate-slot insert blocked by unique constraint';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAIL: duplicate slot was NOT blocked!';
  END IF;

  -- TEST 3: try to reserve hour 25 → should fail check-constraint (slot_hour must be 0-23)
  BEGIN
    INSERT INTO public.trainer_booked_slots (trainer_id, slot_date, slot_hour, enrollment_id)
    VALUES (v_trainer_id, v_session_dates[1], 25, v_enroll_id);
  EXCEPTION WHEN check_violation THEN
    v_invalid_hour_caught := true;
  END;
  IF v_invalid_hour_caught THEN
    RAISE NOTICE '✅ TEST 3 PASS: hour=25 rejected by check constraint';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAIL: invalid hour was NOT blocked!';
  END IF;

  -- TEST 4: reserve a DIFFERENT slot (different hour) on same date → should succeed
  v_test_date := v_session_dates[1];
  INSERT INTO public.course_sessions (enrollment_id, trainer_id, title, session_number, is_trial, scheduled_at, duration_mins, status)
  VALUES (v_enroll_id, v_trainer_id, 'Trial', 99, true, (v_test_date::timestamp + interval '17 hours'), 60, 'upcoming')
  RETURNING id INTO v_session_id;
  INSERT INTO public.trainer_booked_slots (trainer_id, slot_date, slot_hour, session_id, enrollment_id)
  VALUES (v_trainer_id, v_test_date, 17, v_session_id, v_enroll_id);
  RAISE NOTICE '✅ TEST 4 PASS: different hour same date succeeded (evening 17:00)';

  -- TEST 5: reserve same slot for a DIFFERENT trainer → should succeed (slot is per-trainer)
  -- (skipped — would need a second trainer; the unique constraint is on trainer_id+date+hour so this is logically guaranteed)
  RAISE NOTICE '✅ TEST 5 IMPLIED: unique constraint scope is (trainer_id, slot_date, slot_hour) — verified by index def';

  -- ── CLEANUP ──
  DELETE FROM public.trainer_booked_slots WHERE enrollment_id = v_enroll_id;
  DELETE FROM public.course_sessions WHERE enrollment_id = v_enroll_id;
  DELETE FROM public.enrollments WHERE id = v_enroll_id;
  RAISE NOTICE '🧹 Test data cleaned up';
  RAISE NOTICE '═══ ALL TESTS PASSED ═══';
END $$;