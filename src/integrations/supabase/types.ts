export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      admin_communications: {
        Row: {
          body: string
          channel: string | null
          id: string
          recipient_count: number | null
          sent_at: string | null
          sent_by: string
          subject: string
          target_audience: string
        }
        Insert: {
          body: string
          channel?: string | null
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_by: string
          subject: string
          target_audience?: string
        }
        Update: {
          body?: string
          channel?: string | null
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          sent_by?: string
          subject?: string
          target_audience?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          permissions: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          messages: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_interviews: {
        Row: {
          answers: Json | null
          communication_score: number | null
          completed_at: string | null
          confidence_score: number | null
          difficulty: string | null
          id: string
          job_role: string | null
          overall_score: number | null
          questions: Json | null
          status: string | null
          student_id: string
          technical_score: number | null
        }
        Insert: {
          answers?: Json | null
          communication_score?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          difficulty?: string | null
          id?: string
          job_role?: string | null
          overall_score?: number | null
          questions?: Json | null
          status?: string | null
          student_id: string
          technical_score?: number | null
        }
        Update: {
          answers?: Json | null
          communication_score?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          difficulty?: string | null
          id?: string
          job_role?: string | null
          overall_score?: number | null
          questions?: Json | null
          status?: string | null
          student_id?: string
          technical_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          enrollment_id: string
          id: string
          marked_at: string | null
          marked_by: string
          notes: string | null
          session_id: string
          status: string
          student_id: string
        }
        Insert: {
          enrollment_id: string
          id?: string
          marked_at?: string | null
          marked_by: string
          notes?: string | null
          session_id: string
          status?: string
          student_id: string
        }
        Update: {
          enrollment_id?: string
          id?: string
          marked_at?: string | null
          marked_by?: string
          notes?: string | null
          session_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_id: string
          certificate_url: string | null
          communication_score: number | null
          course_name: string | null
          enrollment_id: string
          id: string
          interview_score: number | null
          is_valid: boolean | null
          issue_date: string | null
          overall_score: number | null
          punctuality_score: number | null
          student_id: string
          technical_score: number | null
          trainer_approved: boolean | null
          trainer_comments: string | null
          trainer_id: string
        }
        Insert: {
          certificate_id?: string
          certificate_url?: string | null
          communication_score?: number | null
          course_name?: string | null
          enrollment_id: string
          id?: string
          interview_score?: number | null
          is_valid?: boolean | null
          issue_date?: string | null
          overall_score?: number | null
          punctuality_score?: number | null
          student_id: string
          technical_score?: number | null
          trainer_approved?: boolean | null
          trainer_comments?: string | null
          trainer_id: string
        }
        Update: {
          certificate_id?: string
          certificate_url?: string | null
          communication_score?: number | null
          course_name?: string | null
          enrollment_id?: string
          id?: string
          interview_score?: number | null
          is_valid?: boolean | null
          issue_date?: string | null
          overall_score?: number | null
          punctuality_score?: number | null
          student_id?: string
          technical_score?: number | null
          trainer_approved?: boolean | null
          trainer_comments?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      course_curriculum: {
        Row: {
          course_id: string
          id: string
          learning_outcome: string | null
          session_count: number | null
          topics: string[] | null
          week_number: number | null
          week_title: string | null
        }
        Insert: {
          course_id: string
          id?: string
          learning_outcome?: string | null
          session_count?: number | null
          topics?: string[] | null
          week_number?: number | null
          week_title?: string | null
        }
        Update: {
          course_id?: string
          id?: string
          learning_outcome?: string | null
          session_count?: number | null
          topics?: string[] | null
          week_number?: number | null
          week_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_curriculum_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          actual_duration_mins: number | null
          created_at: string | null
          duration_mins: number | null
          enrollment_id: string
          id: string
          is_trial: boolean | null
          joined_by_student: boolean | null
          joined_by_trainer: boolean | null
          meet_link: string | null
          no_show_by: string | null
          notes: string | null
          recording_url: string | null
          scheduled_at: string | null
          session_number: number | null
          status: string | null
          student_join_time: string | null
          title: string | null
          trainer_id: string
          trainer_join_time: string | null
        }
        Insert: {
          actual_duration_mins?: number | null
          created_at?: string | null
          duration_mins?: number | null
          enrollment_id: string
          id?: string
          is_trial?: boolean | null
          joined_by_student?: boolean | null
          joined_by_trainer?: boolean | null
          meet_link?: string | null
          no_show_by?: string | null
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string | null
          session_number?: number | null
          status?: string | null
          student_join_time?: string | null
          title?: string | null
          trainer_id: string
          trainer_join_time?: string | null
        }
        Update: {
          actual_duration_mins?: number | null
          created_at?: string | null
          duration_mins?: number | null
          enrollment_id?: string
          id?: string
          is_trial?: boolean | null
          joined_by_student?: boolean | null
          joined_by_trainer?: boolean | null
          meet_link?: string | null
          no_show_by?: string | null
          notes?: string | null
          recording_url?: string | null
          scheduled_at?: string | null
          session_number?: number | null
          status?: string | null
          student_join_time?: string | null
          title?: string | null
          trainer_id?: string
          trainer_join_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          approval_status: string | null
          available_slot_bands: string[] | null
          average_rating: number | null
          certification_url: string | null
          course_fee: number
          course_start_date: string | null
          created_at: string | null
          curriculum_pdf_url: string | null
          demo_video_url: string | null
          description: string | null
          duration_days: number | null
          free_trial_enabled: boolean | null
          has_free_trial: boolean | null
          id: string
          intro_video_url: string | null
          is_active: boolean | null
          language: string | null
          level: string | null
          rejection_reason: string | null
          session_duration_mins: number | null
          session_frequency: string | null
          sessions_per_week: number | null
          title: string
          total_enrolled: number | null
          total_sessions: number | null
          trainer_id: string
          verification_selfie_url: string | null
          weekly_curriculum: Json | null
          what_you_learn: string[] | null
          who_is_it_for: string | null
        }
        Insert: {
          approval_status?: string | null
          available_slot_bands?: string[] | null
          average_rating?: number | null
          certification_url?: string | null
          course_fee?: number
          course_start_date?: string | null
          created_at?: string | null
          curriculum_pdf_url?: string | null
          demo_video_url?: string | null
          description?: string | null
          duration_days?: number | null
          free_trial_enabled?: boolean | null
          has_free_trial?: boolean | null
          id?: string
          intro_video_url?: string | null
          is_active?: boolean | null
          language?: string | null
          level?: string | null
          rejection_reason?: string | null
          session_duration_mins?: number | null
          session_frequency?: string | null
          sessions_per_week?: number | null
          title: string
          total_enrolled?: number | null
          total_sessions?: number | null
          trainer_id: string
          verification_selfie_url?: string | null
          weekly_curriculum?: Json | null
          what_you_learn?: string[] | null
          who_is_it_for?: string | null
        }
        Update: {
          approval_status?: string | null
          available_slot_bands?: string[] | null
          average_rating?: number | null
          certification_url?: string | null
          course_fee?: number
          course_start_date?: string | null
          created_at?: string | null
          curriculum_pdf_url?: string | null
          demo_video_url?: string | null
          description?: string | null
          duration_days?: number | null
          free_trial_enabled?: boolean | null
          has_free_trial?: boolean | null
          id?: string
          intro_video_url?: string | null
          is_active?: boolean | null
          language?: string | null
          level?: string | null
          rejection_reason?: string | null
          session_duration_mins?: number | null
          session_frequency?: string | null
          sessions_per_week?: number | null
          title?: string
          total_enrolled?: number | null
          total_sessions?: number | null
          trainer_id?: string
          verification_selfie_url?: string | null
          weekly_curriculum?: Json | null
          what_you_learn?: string[] | null
          who_is_it_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string | null
          description: string | null
          enrollment_id: string | null
          id: string
          raised_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enrollment_id?: string | null
          id?: string
          raised_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enrollment_id?: string | null
          id?: string
          raised_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          digest_emails_enabled: boolean
          id: string
          match_emails_enabled: boolean
          profile_view_emails_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          digest_emails_enabled?: boolean
          id?: string
          match_emails_enabled?: boolean
          profile_view_emails_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          digest_emails_enabled?: boolean
          id?: string
          match_emails_enabled?: boolean
          profile_view_emails_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          amount_paid: number | null
          certificate_eligible: boolean | null
          course_id: string
          end_date: string | null
          enrollment_date: string | null
          id: string
          last_session_date: string | null
          milestones_reached: string[] | null
          platform_commission: number | null
          progress_percent: number | null
          razorpay_payment_id: string | null
          refund_eligible_until: string | null
          refund_requested_at: string | null
          refund_status: string
          resume_unlocked: boolean | null
          sessions_completed: number | null
          sessions_total: number | null
          start_date: string | null
          status: string | null
          student_id: string
          trainer_id: string
          trainer_payout: number | null
        }
        Insert: {
          amount_paid?: number | null
          certificate_eligible?: boolean | null
          course_id: string
          end_date?: string | null
          enrollment_date?: string | null
          id?: string
          last_session_date?: string | null
          milestones_reached?: string[] | null
          platform_commission?: number | null
          progress_percent?: number | null
          razorpay_payment_id?: string | null
          refund_eligible_until?: string | null
          refund_requested_at?: string | null
          refund_status?: string
          resume_unlocked?: boolean | null
          sessions_completed?: number | null
          sessions_total?: number | null
          start_date?: string | null
          status?: string | null
          student_id: string
          trainer_id: string
          trainer_payout?: number | null
        }
        Update: {
          amount_paid?: number | null
          certificate_eligible?: boolean | null
          course_id?: string
          end_date?: string | null
          enrollment_date?: string | null
          id?: string
          last_session_date?: string | null
          milestones_reached?: string[] | null
          platform_commission?: number | null
          progress_percent?: number | null
          razorpay_payment_id?: string | null
          refund_eligible_until?: string | null
          refund_requested_at?: string | null
          refund_status?: string
          resume_unlocked?: boolean | null
          sessions_completed?: number | null
          sessions_total?: number | null
          start_date?: string | null
          status?: string | null
          student_id?: string
          trainer_id?: string
          trainer_payout?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      match_email_log: {
        Row: {
          email_type: string
          id: string
          recipient_email: string
          sent_at: string
        }
        Insert: {
          email_type: string
          id?: string
          recipient_email: string
          sent_at?: string
        }
        Update: {
          email_type?: string
          id?: string
          recipient_email?: string
          sent_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_read: boolean | null
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      parent_accounts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          parent_name: string | null
          phone: string | null
          relationship: string | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          parent_name?: string | null
          phone?: string | null
          relationship?: string | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          parent_name?: string | null
          phone?: string | null
          relationship?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          enrollment_id: string | null
          id: string
          payment_method: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refund_amount: number | null
          status: string | null
          student_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_amount?: number | null
          status?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refund_amount?: number | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          bank_account_number: string | null
          id: string
          ifsc_code: string | null
          processed_amount: number | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          requested_amount: number | null
          requested_at: string | null
          status: string | null
          trainer_id: string
          transaction_reference: string | null
          upi_id: string | null
        }
        Insert: {
          bank_account_number?: string | null
          id?: string
          ifsc_code?: string | null
          processed_amount?: number | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_amount?: number | null
          requested_at?: string | null
          status?: string | null
          trainer_id: string
          transaction_reference?: string | null
          upi_id?: string | null
        }
        Update: {
          bank_account_number?: string | null
          id?: string
          ifsc_code?: string | null
          processed_amount?: number | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_amount?: number | null
          requested_at?: string | null
          status?: string | null
          trainer_id?: string
          transaction_reference?: string | null
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          commission_percent: number
          custom_rating: number | null
          custom_student_count: number | null
          custom_trainer_count: number | null
          homepage_stats_override: boolean
          id: string
          maintenance_mode: boolean
          min_payout_amount: number
          session_reminder_hours: number
          student_referral_reward: number
          trainer_referral_reward: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          commission_percent?: number
          custom_rating?: number | null
          custom_student_count?: number | null
          custom_trainer_count?: number | null
          homepage_stats_override?: boolean
          id?: string
          maintenance_mode?: boolean
          min_payout_amount?: number
          session_reminder_hours?: number
          student_referral_reward?: number
          trainer_referral_reward?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          commission_percent?: number
          custom_rating?: number | null
          custom_student_count?: number | null
          custom_trainer_count?: number | null
          homepage_stats_override?: boolean
          id?: string
          maintenance_mode?: boolean
          min_payout_amount?: number
          session_reminder_hours?: number
          student_referral_reward?: number
          trainer_referral_reward?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          language_preference: string[] | null
          phone: string | null
          profile_picture_url: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_active?: boolean | null
          is_verified?: boolean | null
          language_preference?: string[] | null
          phone?: string | null
          profile_picture_url?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          language_preference?: string[] | null
          phone?: string | null
          profile_picture_url?: string | null
          state?: string | null
        }
        Relationships: []
      }
      progress_milestones: {
        Row: {
          enrollment_id: string
          id: string
          milestone_type: string | null
          notified: boolean | null
          reached_at: string | null
        }
        Insert: {
          enrollment_id: string
          id?: string
          milestone_type?: string | null
          notified?: boolean | null
          reached_at?: string | null
        }
        Update: {
          enrollment_id?: string
          id?: string
          milestone_type?: string | null
          notified?: boolean | null
          reached_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_milestones_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          communication_score: number | null
          created_at: string | null
          enrollment_id: string
          id: string
          punctuality_score: number | null
          session_id: string | null
          student_communication_rating: number | null
          student_id: string
          student_punctuality_rating: number | null
          student_rated_at: string | null
          student_review_text: string | null
          student_teaching_quality: number | null
          student_to_trainer_rating: number | null
          student_to_trainer_review: string | null
          technical_score: number | null
          trainer_id: string
          trainer_private_notes: string | null
          trainer_rated_at: string | null
          trainer_to_student_communication: number | null
          trainer_to_student_engagement: number | null
          trainer_to_student_preparation: number | null
          trainer_to_student_punctuality: number | null
          trainer_to_student_rating: number | null
          trainer_to_student_review: string | null
        }
        Insert: {
          communication_score?: number | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          punctuality_score?: number | null
          session_id?: string | null
          student_communication_rating?: number | null
          student_id: string
          student_punctuality_rating?: number | null
          student_rated_at?: string | null
          student_review_text?: string | null
          student_teaching_quality?: number | null
          student_to_trainer_rating?: number | null
          student_to_trainer_review?: string | null
          technical_score?: number | null
          trainer_id: string
          trainer_private_notes?: string | null
          trainer_rated_at?: string | null
          trainer_to_student_communication?: number | null
          trainer_to_student_engagement?: number | null
          trainer_to_student_preparation?: number | null
          trainer_to_student_punctuality?: number | null
          trainer_to_student_rating?: number | null
          trainer_to_student_review?: string | null
        }
        Update: {
          communication_score?: number | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          punctuality_score?: number | null
          session_id?: string | null
          student_communication_rating?: number | null
          student_id?: string
          student_punctuality_rating?: number | null
          student_rated_at?: string | null
          student_review_text?: string | null
          student_teaching_quality?: number | null
          student_to_trainer_rating?: number | null
          student_to_trainer_review?: string | null
          technical_score?: number | null
          trainer_id?: string
          trainer_private_notes?: string | null
          trainer_rated_at?: string | null
          trainer_to_student_communication?: number | null
          trainer_to_student_engagement?: number | null
          trainer_to_student_preparation?: number | null
          trainer_to_student_punctuality?: number | null
          trainer_to_student_rating?: number | null
          trainer_to_student_review?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string | null
          referred_id: string | null
          referrer_id: string
          reward_amount: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code?: string | null
          referred_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string | null
          referred_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string | null
          id: string
          results_count: number | null
          search_query: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_query?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_query?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_reflections: {
        Row: {
          confidence_level: number
          created_at: string
          id: string
          learned_today: string
          questions_for_next: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          confidence_level?: number
          created_at?: string
          id?: string
          learned_today?: string
          questions_for_next?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          confidence_level?: number
          created_at?: string
          id?: string
          learned_today?: string
          questions_for_next?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_reflections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_reflections_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_resumes: {
        Row: {
          ai_improved_objective: string | null
          ats_score: number | null
          certifications: Json | null
          education: Json | null
          id: string
          objective: string | null
          pdf_url: string | null
          projects: Json | null
          skills: string[] | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          ai_improved_objective?: string | null
          ats_score?: number | null
          certifications?: Json | null
          education?: Json | null
          id?: string
          objective?: string | null
          pdf_url?: string | null
          projects?: Json | null
          skills?: string[] | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          ai_improved_objective?: string | null
          ats_score?: number | null
          certifications?: Json | null
          education?: Json | null
          id?: string
          objective?: string | null
          pdf_url?: string | null
          projects?: Json | null
          skills?: string[] | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_resumes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          college_name: string | null
          course_interests: string[] | null
          course_of_study: string | null
          created_at: string | null
          education_level: string | null
          graduation_year: number | null
          id: string
          referral_code: string | null
          referral_credits: number | null
          referred_by: string | null
          skill_experience: string | null
          skills_learning: string[] | null
          student_status: string | null
          total_sessions_attended: number | null
          total_spent: number | null
          trainer_gender_preference: string | null
          user_id: string
        }
        Insert: {
          college_name?: string | null
          course_interests?: string[] | null
          course_of_study?: string | null
          created_at?: string | null
          education_level?: string | null
          graduation_year?: number | null
          id?: string
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          skill_experience?: string | null
          skills_learning?: string[] | null
          student_status?: string | null
          total_sessions_attended?: number | null
          total_spent?: number | null
          trainer_gender_preference?: string | null
          user_id: string
        }
        Update: {
          college_name?: string | null
          course_interests?: string[] | null
          course_of_study?: string | null
          created_at?: string | null
          education_level?: string | null
          graduation_year?: number | null
          id?: string
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          skill_experience?: string | null
          skills_learning?: string[] | null
          student_status?: string | null
          total_sessions_attended?: number | null
          total_spent?: number | null
          trainer_gender_preference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trainer_availability: {
        Row: {
          day_of_week: number | null
          end_time: string | null
          id: string
          is_available: boolean | null
          start_time: string | null
          trainer_id: string
        }
        Insert: {
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          start_time?: string | null
          trainer_id: string
        }
        Update: {
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          start_time?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_availability_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_booked_slots: {
        Row: {
          created_at: string
          enrollment_id: string | null
          id: string
          session_id: string | null
          slot_date: string
          slot_hour: number
          trainer_id: string
          trial_booking_id: string | null
        }
        Insert: {
          created_at?: string
          enrollment_id?: string | null
          id?: string
          session_id?: string | null
          slot_date: string
          slot_hour: number
          trainer_id: string
          trial_booking_id?: string | null
        }
        Update: {
          created_at?: string
          enrollment_id?: string | null
          id?: string
          session_id?: string | null
          slot_date?: string
          slot_hour?: number
          trainer_id?: string
          trial_booking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_booked_slots_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_booked_slots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_booked_slots_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_booked_slots_trial_booking_id_fkey"
            columns: ["trial_booking_id"]
            isOneToOne: false
            referencedRelation: "trial_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_documents: {
        Row: {
          document_name: string | null
          document_type: string | null
          document_url: string | null
          id: string
          rejection_reason: string | null
          trainer_id: string
          uploaded_at: string | null
          verification_status: string | null
        }
        Insert: {
          document_name?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          trainer_id: string
          uploaded_at?: string | null
          verification_status?: string | null
        }
        Update: {
          document_name?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          trainer_id?: string
          uploaded_at?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_documents_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_invitations: {
        Row: {
          created_at: string
          email: string
          emails_sent: number
          id: string
          invited_at: string
          invited_by: string
          reminder_sent_at: string | null
          signed_up_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          emails_sent?: number
          id?: string
          invited_at?: string
          invited_by: string
          reminder_sent_at?: string | null
          signed_up_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          emails_sent?: number
          id?: string
          invited_at?: string
          invited_by?: string
          reminder_sent_at?: string | null
          signed_up_at?: string | null
          status?: string
        }
        Relationships: []
      }
      trainer_referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string | null
          referred_id: string | null
          referrer_id: string
          reward_amount: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code?: string | null
          referred_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string | null
          referred_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainer_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_subscriptions: {
        Row: {
          amount: number | null
          auto_renew: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          plan: string | null
          razorpay_subscription_id: string | null
          start_date: string | null
          status: string | null
          trainer_id: string
        }
        Insert: {
          amount?: number | null
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: string | null
          razorpay_subscription_id?: string | null
          start_date?: string | null
          status?: string | null
          trainer_id: string
        }
        Update: {
          amount?: number | null
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          plan?: string | null
          razorpay_subscription_id?: string | null
          start_date?: string | null
          status?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_subscriptions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_trial_settings: {
        Row: {
          id: string
          max_trials_per_month: number
          trainer_id: string
          trial_availability: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          max_trials_per_month?: number
          trainer_id: string
          trial_availability?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          max_trials_per_month?: number
          trainer_id?: string
          trial_availability?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_trial_settings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: true
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          aadhaar_url: string | null
          account_holder_name: string | null
          additional_services_details: string | null
          address: string | null
          approval_status: string | null
          available_balance: number | null
          available_time_bands: string[] | null
          average_rating: number | null
          bank_account_number: string | null
          bio: string | null
          boost_score: number | null
          course_description: string | null
          course_duration: string | null
          course_fee: number | null
          course_materials: string | null
          course_status: string
          course_title: string | null
          created_at: string | null
          current_company: string | null
          current_role: string | null
          curriculum_pdf_url: string | null
          default_slot_bands: string[] | null
          demo_video_url: string | null
          dob: string | null
          experience_years: number | null
          expertise_areas: string[] | null
          govt_id_type: string | null
          hide_photo: boolean
          id: string
          ifsc_code: string | null
          intro_video_url: string | null
          is_job_seeker: boolean | null
          last_saved_at: string | null
          linkedin_url: string | null
          onboarding_data: Json | null
          onboarding_status: string | null
          onboarding_step: number | null
          pan_number: string | null
          pincode: string | null
          portfolio_url: string | null
          previous_companies: string[] | null
          profile_status: string
          referral_code: string | null
          referral_credits: number | null
          referred_by: string | null
          rejection_reason: string | null
          secondary_skill: string | null
          selfie_url: string | null
          services_offered: string[] | null
          session_duration_per_day: string | null
          skills: string[] | null
          subscription_plan: string | null
          teaching_languages: string[] | null
          total_earnings: number | null
          total_sessions: number | null
          total_students: number | null
          total_withdrawn: number | null
          trainer_status: string
          trainer_type: string | null
          upi_id: string | null
          user_id: string
          verification_method: string | null
          verification_value: string | null
          weekend_availability: string | null
          whatsapp: string | null
          work_email: string | null
        }
        Insert: {
          aadhaar_url?: string | null
          account_holder_name?: string | null
          additional_services_details?: string | null
          address?: string | null
          approval_status?: string | null
          available_balance?: number | null
          available_time_bands?: string[] | null
          average_rating?: number | null
          bank_account_number?: string | null
          bio?: string | null
          boost_score?: number | null
          course_description?: string | null
          course_duration?: string | null
          course_fee?: number | null
          course_materials?: string | null
          course_status?: string
          course_title?: string | null
          created_at?: string | null
          current_company?: string | null
          current_role?: string | null
          curriculum_pdf_url?: string | null
          default_slot_bands?: string[] | null
          demo_video_url?: string | null
          dob?: string | null
          experience_years?: number | null
          expertise_areas?: string[] | null
          govt_id_type?: string | null
          hide_photo?: boolean
          id?: string
          ifsc_code?: string | null
          intro_video_url?: string | null
          is_job_seeker?: boolean | null
          last_saved_at?: string | null
          linkedin_url?: string | null
          onboarding_data?: Json | null
          onboarding_status?: string | null
          onboarding_step?: number | null
          pan_number?: string | null
          pincode?: string | null
          portfolio_url?: string | null
          previous_companies?: string[] | null
          profile_status?: string
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          rejection_reason?: string | null
          secondary_skill?: string | null
          selfie_url?: string | null
          services_offered?: string[] | null
          session_duration_per_day?: string | null
          skills?: string[] | null
          subscription_plan?: string | null
          teaching_languages?: string[] | null
          total_earnings?: number | null
          total_sessions?: number | null
          total_students?: number | null
          total_withdrawn?: number | null
          trainer_status?: string
          trainer_type?: string | null
          upi_id?: string | null
          user_id: string
          verification_method?: string | null
          verification_value?: string | null
          weekend_availability?: string | null
          whatsapp?: string | null
          work_email?: string | null
        }
        Update: {
          aadhaar_url?: string | null
          account_holder_name?: string | null
          additional_services_details?: string | null
          address?: string | null
          approval_status?: string | null
          available_balance?: number | null
          available_time_bands?: string[] | null
          average_rating?: number | null
          bank_account_number?: string | null
          bio?: string | null
          boost_score?: number | null
          course_description?: string | null
          course_duration?: string | null
          course_fee?: number | null
          course_materials?: string | null
          course_status?: string
          course_title?: string | null
          created_at?: string | null
          current_company?: string | null
          current_role?: string | null
          curriculum_pdf_url?: string | null
          default_slot_bands?: string[] | null
          demo_video_url?: string | null
          dob?: string | null
          experience_years?: number | null
          expertise_areas?: string[] | null
          govt_id_type?: string | null
          hide_photo?: boolean
          id?: string
          ifsc_code?: string | null
          intro_video_url?: string | null
          is_job_seeker?: boolean | null
          last_saved_at?: string | null
          linkedin_url?: string | null
          onboarding_data?: Json | null
          onboarding_status?: string | null
          onboarding_step?: number | null
          pan_number?: string | null
          pincode?: string | null
          portfolio_url?: string | null
          previous_companies?: string[] | null
          profile_status?: string
          referral_code?: string | null
          referral_credits?: number | null
          referred_by?: string | null
          rejection_reason?: string | null
          secondary_skill?: string | null
          selfie_url?: string | null
          services_offered?: string[] | null
          session_duration_per_day?: string | null
          skills?: string[] | null
          subscription_plan?: string | null
          teaching_languages?: string[] | null
          total_earnings?: number | null
          total_sessions?: number | null
          total_students?: number | null
          total_withdrawn?: number | null
          trainer_status?: string
          trainer_type?: string | null
          upi_id?: string | null
          user_id?: string
          verification_method?: string | null
          verification_value?: string | null
          weekend_availability?: string | null
          whatsapp?: string | null
          work_email?: string | null
        }
        Relationships: []
      }
      trial_bookings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          meet_link: string | null
          rejection_reason: string | null
          responded_at: string | null
          scheduled_at: string | null
          selected_date: string | null
          selected_day: number | null
          selected_hour: number | null
          selected_slot: string | null
          status: string
          student_id: string
          trainer_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          meet_link?: string | null
          rejection_reason?: string | null
          responded_at?: string | null
          scheduled_at?: string | null
          selected_date?: string | null
          selected_day?: number | null
          selected_hour?: number | null
          selected_slot?: string | null
          status?: string
          student_id: string
          trainer_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          meet_link?: string | null
          rejection_reason?: string | null
          responded_at?: string | null
          scheduled_at?: string | null
          selected_date?: string | null
          selected_day?: number | null
          selected_hour?: number | null
          selected_slot?: string | null
          status?: string
          student_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_bookings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          id: string
          last_updated: string | null
          total_earned: number
          total_withdrawn: number
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          last_updated?: string | null
          total_earned?: number
          total_withdrawn?: number
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          last_updated?: string | null
          total_earned?: number
          total_withdrawn?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_referred_trainer: {
        Args: { _trainer_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_trainer_referral: {
        Args: { _referred_id: string; _referrer_id: string; _user_id: string }
        Returns: boolean
      }
      create_verified_enrollment: {
        Args: {
          p_amount_paid: number
          p_course_id: string
          p_is_trial?: boolean
          p_payment_id: string
          p_sessions_total?: number
          p_student_id: string
          p_trainer_id: string
        }
        Returns: string
      }
      credit_wallet_atomic: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      debit_wallet_atomic: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_approved_trainers_list: {
        Args: never
        Returns: {
          trainer_approval_status: string
          trainer_average_rating: number
          trainer_bio: string
          trainer_boost_score: number
          trainer_current_company: string
          trainer_current_role: string
          trainer_experience_years: number
          trainer_hide_photo: boolean
          trainer_id: string
          trainer_is_job_seeker: boolean
          trainer_skills: string[]
          trainer_subscription_plan: string
          trainer_teaching_languages: string[]
          trainer_total_students: number
          trainer_user_id: string
        }[]
      }
      get_enrollment_financials: {
        Args: { _enrollment_id: string }
        Returns: {
          amount_paid: number
          platform_commission: number
          trainer_payout: number
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          p_city: string
          p_full_name: string
          p_gender: string
          p_id: string
          p_is_verified: boolean
          p_profile_picture_url: string
          p_state: string
        }[]
      }
      get_public_profiles_bulk: {
        Args: { profile_ids: string[] }
        Returns: {
          p_city: string
          p_full_name: string
          p_gender: string
          p_id: string
          p_is_verified: boolean
          p_profile_picture_url: string
          p_state: string
        }[]
      }
      get_public_ratings: {
        Args: { p_trainer_id: string }
        Returns: {
          r_created_at: string
          r_enrollment_id: string
          r_id: string
          r_student_communication_rating: number
          r_student_id: string
          r_student_punctuality_rating: number
          r_student_rated_at: string
          r_student_teaching_quality: number
          r_student_to_trainer_rating: number
          r_student_to_trainer_review: string
          r_trainer_id: string
        }[]
      }
      get_public_trainer_profile: {
        Args: { trainer_row_id: string }
        Returns: {
          trainer_approval_status: string
          trainer_average_rating: number
          trainer_bio: string
          trainer_boost_score: number
          trainer_current_company: string
          trainer_current_role: string
          trainer_experience_years: number
          trainer_hide_photo: boolean
          trainer_id: string
          trainer_intro_video_url: string
          trainer_is_job_seeker: boolean
          trainer_linkedin_url: string
          trainer_previous_companies: string[]
          trainer_skills: string[]
          trainer_subscription_plan: string
          trainer_teaching_languages: string[]
          trainer_total_students: number
          trainer_user_id: string
        }[]
      }
      get_student_user_ids: {
        Args: { student_ids: string[] }
        Returns: {
          student_id: string
          user_id: string
        }[]
      }
      get_trainer_id_for_user: { Args: { _user_id: string }; Returns: string }
      get_trainer_trial_count_this_month: {
        Args: { p_trainer_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_course_enrolled: {
        Args: { course_id_param: string }
        Returns: undefined
      }
      is_student_owner: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      is_trainer_owner: {
        Args: { _trainer_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      student_has_enrollment: {
        Args: { _enrollment_id: string; _user_id: string }
        Returns: boolean
      }
      trainer_has_enrollment: {
        Args: { _enrollment_id: string; _user_id: string }
        Returns: boolean
      }
      trainer_has_enrollment_for_student: {
        Args: { _student_id: string; _user_id: string }
        Returns: boolean
      }
      verify_certificate: {
        Args: { cert_id: string }
        Returns: {
          c_certificate_id: string
          c_course_name: string
          c_is_valid: boolean
          c_issue_date: string
          c_student_id: string
          c_trainer_id: string
        }[]
      }
    }
    Enums: {
      app_role: "student" | "trainer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "trainer", "admin"],
    },
  },
} as const
