import { useState, useEffect, useMemo } from "react";
import { formatDateTimeWeekdayIST } from "@/lib/dateUtils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { CheckCircle2, Clock, Calendar, Shield, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { generateMeetLink } from "@/lib/meetingLink";
import {
  SLOT_BANDS,
  hoursForBands,
  formatHourLabel,
  buildWeeklySessionDates,
  toLocalDateString,
  WEEKDAY_LABELS,
} from "@/lib/slotBands";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface EnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  course: any;
  trainer: any;
  trainerProfile: any;
  studentId: string;
  hasTrialBooked: boolean;
}

const EnrollmentModal = ({ open, onClose, course, trainer, trainerProfile, studentId, hasTrialBooked }: EnrollmentModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"type" | "slot" | "confirm">("type");
  const [bookingType, setBookingType] = useState<"trial" | "enroll">(hasTrialBooked ? "enroll" : "trial");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Array<{ slot_date: string; slot_hour: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isReferred, setIsReferred] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [trialSlotsFullThisMonth, setTrialSlotsFullThisMonth] = useState(false);
  const [hasExistingTrialWithTrainer, setHasExistingTrialWithTrainer] = useState(false);

  // Lightweight profile prompt — collected just-in-time at booking confirm
  const [missingProfile, setMissingProfile] = useState<{ phone: boolean; city: boolean; full_name: boolean }>({ phone: false, city: false, full_name: false });
  const [profileFullName, setProfileFullName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Check trial eligibility
  useEffect(() => {
    if (!studentId || !trainer?.id || !open || trainer.id.startsWith("demo-")) return;
    const checkTrialEligibility = async () => {
      // Check if student already had a trial with THIS trainer
      const { data: existingTrial } = await supabase
        .from("trial_bookings")
        .select("id")
        .eq("student_id", studentId)
        .eq("trainer_id", trainer.id)
        .limit(1);

      setHasExistingTrialWithTrainer(!!(existingTrial && existingTrial.length > 0));

      // Check if trainer has reached monthly trial limit
      const { data: settings } = await supabase
        .from("trainer_trial_settings")
        .select("max_trials_per_month")
        .eq("trainer_id", trainer.id)
        .maybeSingle();

      const maxTrials = settings?.max_trials_per_month ?? 5;

      // Count trials this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("trial_bookings")
        .select("id", { count: "exact", head: true })
        .eq("trainer_id", trainer.id)
        .in("status", ["pending", "approved"])
        .gte("created_at", startOfMonth.toISOString());

      setTrialSlotsFullThisMonth((count || 0) >= maxTrials);
    };
    checkTrialEligibility();
  }, [studentId, trainer?.id, open]);

  // Check referral status
  useEffect(() => {
    if (!studentId || !open) return;
    const checkReferral = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: student }, { data: wallet }, { data: existingEnrollments }] = await Promise.all([
        supabase.from("students").select("referred_by").eq("id", studentId).maybeSingle(),
        supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("enrollments").select("id").eq("student_id", studentId).eq("status", "active").limit(1),
      ]);
      setIsReferred(!!(student?.referred_by) && (!existingEnrollments || existingEnrollments.length === 0));
      setWalletBalance(Number(wallet?.balance || 0));
    };
    checkReferral();
  }, [studentId, open]);

  // Load already-booked trainer slots so we can disable taken hours
  useEffect(() => {
    if (!trainer?.id || trainer.id.startsWith("demo-") || !open) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = new Date(today); horizon.setDate(today.getDate() + 120);
    supabase.from("trainer_booked_slots")
      .select("slot_date, slot_hour")
      .eq("trainer_id", trainer.id)
      .gte("slot_date", toLocalDateString(today))
      .lte("slot_date", toLocalDateString(horizon))
      .then(({ data }) => setBookedSlots(data || []));
  }, [trainer?.id, open]);

  // Load current profile to detect missing essentials for the JIT prompt
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("full_name, phone, city").eq("id", user.id).maybeSingle();
      setProfileFullName(p?.full_name || "");
      setProfilePhone(p?.phone || "");
      setProfileCity(p?.city || "");
      setMissingProfile({
        full_name: !p?.full_name?.trim(),
        phone: !p?.phone?.trim(),
        city: !p?.city?.trim(),
      });
    })();
  }, [open]);

  const hasMissingProfile = missingProfile.full_name || missingProfile.phone || missingProfile.city;

  const saveQuickProfile = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    if (missingProfile.full_name && !profileFullName.trim()) {
      toast({ title: "Please enter your name", variant: "warning" });
      return false;
    }
    if (missingProfile.phone && !/^[6-9]\d{9}$/.test(profilePhone.trim())) {
      toast({ title: "Please enter a valid 10-digit phone", variant: "warning" });
      return false;
    }
    if (missingProfile.city && !profileCity.trim()) {
      toast({ title: "Please enter your city", variant: "warning" });
      return false;
    }
    setSavingProfile(true);
    const updates: Record<string, any> = {};
    if (missingProfile.full_name) updates.full_name = profileFullName.trim();
    if (missingProfile.phone) updates.phone = profilePhone.trim();
    if (missingProfile.city) updates.city = profileCity.trim();
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: "Couldn't save details", description: error.message, variant: "destructive" });
      return false;
    }
    setMissingProfile({ full_name: false, phone: false, city: false });
    return true;
  };

  const trialBlocked = hasTrialBooked || hasExistingTrialWithTrainer || trialSlotsFullThisMonth;

  const courseFee = Number(course?.course_fee || 0);
  const referralDiscount = (bookingType === "enroll" && isReferred) ? 100 : 0;
  const walletDeduction = (bookingType === "enroll" && useWallet) ? Math.min(walletBalance, courseFee - referralDiscount) : 0;
  const finalAmount = Math.max(0, courseFee - referralDiscount - walletDeduction);

  // ---- Calendar / slot derivations ----
  const courseStartDate: Date | null = useMemo(() => {
    if (!course?.course_start_date) return null;
    const d = new Date(course.course_start_date + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [course?.course_start_date]);

  const allowedBands: string[] = useMemo(() => {
    return (course?.available_slot_bands as string[] | undefined) || [];
  }, [course?.available_slot_bands]);

  const allowedHours: number[] = useMemo(() => hoursForBands(allowedBands), [allowedBands]);

  // Calendar disabled-date predicate: disable past, dates before course_start_date.
  const isDateDisabled = (date: Date) => {
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (d.getTime() < today.getTime()) return true;
    if (courseStartDate) {
      const start = new Date(courseStartDate); start.setHours(0, 0, 0, 0);
      if (d.getTime() < start.getTime()) return true;
    }
    return false;
  };

  // Hours that are already booked (taken) for the selected date
  const takenHoursOnSelectedDate: Set<number> = useMemo(() => {
    if (!selectedDate) return new Set();
    const ds = toLocalDateString(selectedDate);
    return new Set(bookedSlots.filter(s => s.slot_date === ds).map(s => s.slot_hour));
  }, [selectedDate, bookedSlots]);

  const totalSessions = Number(course?.total_sessions || 1);

  // Preview the recurring weekly session dates given current selection
  const previewDates: Date[] = useMemo(() => {
    if (!selectedDate || selectedHour === null) return [];
    return buildWeeklySessionDates({
      startDate: selectedDate,
      weekday: selectedDate.getDay(),
      hour: selectedHour,
      count: bookingType === "trial" ? 1 : totalSessions,
    });
  }, [selectedDate, selectedHour, totalSessions, bookingType]);

  const firstSessionDate: Date | null = previewDates[0] || null;

  const handleTrialBooking = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (course.id?.startsWith("demo-")) {
        toast({ title: "Demo Course", description: "This is a demo course. Sign up to enroll in real courses!", variant: "info" });
        onClose();
        return;
      }

      if (!selectedDate || selectedHour === null) {
        toast({ title: "Pick a date and time", variant: "warning" });
        setSubmitting(false);
        return;
      }

      const firstDate = new Date(selectedDate);
      firstDate.setHours(selectedHour, 0, 0, 0);
      const scheduledTimeStr = formatDateTimeWeekdayIST(firstDate);
      const slotDateStr = toLocalDateString(firstDate);

      // Check for duplicate trial: any pending/approved trial with this trainer
      const { data: existingOnDate } = await supabase
        .from("trial_bookings")
        .select("id")
        .eq("student_id", studentId)
        .eq("trainer_id", trainer.id)
        .in("status", ["pending", "approved"])
        .limit(1);

      if (existingOnDate && existingOnDate.length > 0) {
        toast({ title: "Already requested", description: "You already have a trial with this trainer.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Slot taken check (trainer-wide)
      const { data: clash } = await supabase
        .from("trainer_booked_slots")
        .select("id")
        .eq("trainer_id", trainer.id)
        .eq("slot_date", slotDateStr)
        .eq("slot_hour", selectedHour)
        .limit(1);
      if (clash && clash.length > 0) {
        toast({ title: "Slot just got booked", description: "Please pick another time.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Create trial booking request (pending approval)
      const { error: tbError } = await supabase.from("trial_bookings").insert({
        student_id: studentId,
        trainer_id: trainer.id,
        course_id: course.id,
        status: "pending",
        selected_day: firstDate.getDay(),
        selected_slot: `${selectedHour}:00`,
        selected_date: slotDateStr,
        selected_hour: selectedHour,
        scheduled_at: firstDate.toISOString(),
      });

      if (tbError) {
        if (tbError.code === "23505") {
          toast({ title: "Already requested", description: "You have already used your free trial with this trainer.", variant: "destructive" });
        } else {
          throw tbError;
        }
        return;
      }

      // Notifications
      await supabase.from("notifications").insert({
        user_id: trainer.user_id,
        title: "New Trial Request! 📩",
        body: `A student wants a free trial in "${course.title}". Please approve or reject within 24 hours.`,
        type: "trial_request",
        action_url: "/trainer/sessions",
      });

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase.from("notifications").insert({
          user_id: currentUser.id,
          title: "Trial Request Sent! 📩",
          body: `Your trial request for "${course.title}" with ${trainerProfile?.full_name || "trainer"} has been sent. Waiting for approval.`,
          type: "trial_request",
          action_url: "/student/sessions",
        });
      }

      // Send emails via edge function (fire-and-forget)
      const studentEmail = currentUser?.email;
      const trainerEmail = trainerProfile?.email;

      // Email to student
      if (studentEmail) {
        supabase.functions.invoke("send-email", {
          body: {
            type: "trial_request_student",
            to: studentEmail,
            data: {
              name: currentUser?.user_metadata?.full_name || "Student",
              course_name: course.title,
              trainer_name: trainerProfile?.full_name || "Trainer",
              skill: course.title,
              scheduled_time: scheduledTimeStr,
            },
          },
        }).catch(e => console.error("trial_request_student email failed:", e));
      }

      // Email to trainer  
      if (trainerEmail) {
        supabase.functions.invoke("send-email", {
          body: {
            type: "trial_request_trainer",
            to: trainerEmail,
            data: {
              trainer_name: trainerProfile?.full_name || "Trainer",
              student_name: currentUser?.user_metadata?.full_name || "Student",
              course_name: course.title,
              skill: course.title,
              scheduled_time: scheduledTimeStr,
              student_email: studentEmail,
            },
          },
        }).catch(e => console.error("trial_request_trainer email failed:", e));
      }

      // Email to admin
      supabase.functions.invoke("send-email", {
        body: {
          type: "trial_request_admin",
          to: "contact@skillmitra.online",
          data: {
            student_name: currentUser?.user_metadata?.full_name || "Student",
            trainer_name: trainerProfile?.full_name || "Trainer",
            course_name: course.title,
          },
        },
      }).catch(e => console.error("trial_request_admin email failed:", e));

      toast({ title: "Trial Request Sent! 📩", description: "Your trial request has been sent to the trainer. You'll get an email when they respond.", variant: "success" });
      onClose();
      navigate("/student/sessions");
    } catch (err: any) {
      console.error("Trial booking error:", err);
      toast({ title: "Error", description: err.message || "Failed to book trial.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaidEnrollment = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (course.id?.startsWith("demo-")) {
        toast({ title: "Demo Course", description: "This is a demo course. Sign up to enroll in real courses!", variant: "info" });
        onClose();
        return;
      }

      if (!courseFee || courseFee <= 0) {
        toast({ title: "Invalid Course Fee", description: "This course has no valid fee set. Please contact support.", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-razorpay-order", {
        body: {
          course_id: course.id,
          student_id: studentId,
          amount: finalAmount,
          wallet_deduction: walletDeduction,
          referral_discount: referralDiscount,
        },
      });

      if (orderError || !orderData?.order_id) {
        throw new Error(orderData?.error || "Failed to create payment order");
      }

      // Free-enrollment path: wallet + referral discount fully covered the fee
      if (orderData.free_enrollment) {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
          body: {
            razorpay_order_id: orderData.order_id,
            course_id: course.id,
            trainer_id: trainer.id,
            student_id: studentId,
            selected_day: selectedDate?.getDay() ?? null,
            selected_slot: selectedHour !== null ? `${selectedHour}:00` : null,
            selected_date: selectedDate ? toLocalDateString(selectedDate) : null,
            selected_hour: selectedHour,
            booking_type: "enroll",
          },
        });
        if (verifyError || !verifyData?.success) {
          throw new Error(verifyData?.error || "Free enrollment failed");
        }
        toast({ title: "Enrolled Successfully! 🎉", description: "Fully covered by your wallet/referral credit.", variant: "success" });
        onClose();
        navigate(`/student/receipt/${verifyData.enrollment_id}`);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SkillMitra",
        description: `Enrollment: ${course.title}`,
        order_id: orderData.order_id,
        prefill: orderData.prefill,
        theme: { color: "#1A56DB" },
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                course_id: course.id,
                trainer_id: trainer.id,
                student_id: studentId,
                selected_day: selectedDate?.getDay() ?? null,
                selected_slot: selectedHour !== null ? `${selectedHour}:00` : null,
                selected_date: selectedDate ? toLocalDateString(selectedDate) : null,
                selected_hour: selectedHour,
                booking_type: "enroll",
              },
            });

            if (verifyError || !verifyData?.success) {
              throw new Error(verifyData?.error || "Payment verification failed");
            }

            toast({ title: "Enrolled Successfully! 🎉", description: "Payment confirmed. Check your sessions page.", variant: "success" });
            onClose();
            navigate(`/student/receipt/${verifyData.enrollment_id}`);
          } catch (err: any) {
            console.error("Verification error:", err);
            setSubmitting(false);
            toast({ title: "Verification Issue", description: "Payment received but verification failed. Please contact support.", variant: "destructive" });
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            toast({ title: "Payment Cancelled", description: "You can try again anytime.", variant: "info" });
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error("Payment system not loaded. Please refresh and try again.");
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        setSubmitting(false);
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment could not be completed. Please try again.",
          variant: "destructive",
        });
      });
      rzp.open();
    } catch (err: any) {
      console.error("Payment error:", err);
      setSubmitting(false);
      toast({ title: "Error", description: err.message || "Failed to initiate payment.", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (hasMissingProfile) {
      const ok = await saveQuickProfile();
      if (!ok) return;
    }
    if (bookingType === "trial") {
      handleTrialBooking();
    } else {
      handlePaidEnrollment();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === "type" && "Choose Booking Type"}
            {step === "slot" && "Select Your Preferred Time"}
            {step === "confirm" && "Confirm Your Booking"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Booking Type */}
        {step === "type" && (
          <div className="space-y-4">
            {course.has_free_trial && !trialBlocked && (
              <button
                onClick={() => { setBookingType("trial"); setStep("slot"); }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-primary/50 ${
                  bookingType === "trial" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Free Trial Session</p>
                    <p className="text-sm text-muted-foreground mt-1">Request a trial — trainer approval required</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">FREE</Badge>
                </div>
              </button>
            )}

            <button
              onClick={() => { setBookingType("enroll"); setStep("slot"); }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-primary/50 ${
                bookingType === "enroll" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Full Course Enrollment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.total_sessions || "All"} sessions • {course.session_duration_mins || 60} mins each
                  </p>
                </div>
                <span className="font-bold text-foreground">₹{Number(course.course_fee).toLocaleString()}</span>
              </div>
            </button>

            {(hasTrialBooked || hasExistingTrialWithTrainer) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You have already used your free trial with this trainer.</span>
              </div>
            )}

            {trialSlotsFullThisMonth && !hasTrialBooked && !hasExistingTrialWithTrainer && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-sm text-amber-700 border border-amber-200">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>This trainer's free trial slots are full for this month. You can directly enroll in their course.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Calendar + 1-hour slot selection */}
        {step === "slot" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-foreground space-y-1">
              {courseStartDate && (
                <p>📅 Available from <span className="font-medium">{courseStartDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></p>
              )}
              {allowedBands.length > 0 && (
                <p>🕒 Slots: {allowedBands.map(b => SLOT_BANDS.find(s => s.id === b)?.label).filter(Boolean).join(" / ")}</p>
              )}
            </div>

            {allowedHours.length === 0 || !courseStartDate ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This course doesn't have a start date or available time bands set yet. Please contact the trainer.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Pick a date
                  </label>
                  <div className="rounded-lg border bg-card p-2 flex justify-center">
                    <CalendarPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => { setSelectedDate(d); setSelectedHour(null); }}
                      disabled={isDateDisabled}
                      defaultMonth={courseStartDate}
                      fromDate={courseStartDate}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Pick a 1-hour slot
                  </label>
                  {!selectedDate ? (
                    <p className="text-xs text-muted-foreground">Select a date first to see available time slots.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {allowedHours.map(h => {
                        const taken = takenHoursOnSelectedDate.has(h);
                        const active = selectedHour === h;
                        return (
                          <button
                            key={h}
                            disabled={taken}
                            onClick={() => setSelectedHour(h)}
                            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                              taken
                                ? "bg-muted text-muted-foreground border-border cursor-not-allowed line-through"
                                : active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-card text-foreground border-border hover:border-primary/30"
                            }`}
                          >
                            {formatHourLabel(h)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {previewDates.length > 0 && bookingType === "enroll" && (
                  <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    Your sessions will recur every <span className="font-medium text-foreground">{WEEKDAY_LABELS[selectedDate!.getDay()].long}</span> at <span className="font-medium text-foreground">{formatHourLabel(selectedHour!)}</span> — {previewDates.length} sessions in total.
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>Back</Button>
              <Button className="flex-1" disabled={!selectedDate || selectedHour === null}
                onClick={() => setStep("confirm")}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirm" && (() => {
          return (
          <div className="space-y-5">
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium text-foreground text-right max-w-[200px] truncate">{course.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trainer</span>
                <span className="font-medium text-foreground">{trainerProfile?.full_name || "Trainer"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{bookingType === "trial" ? "Free Trial (Pending Approval)" : "Full Enrollment"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{selectedDate ? selectedDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">{selectedHour !== null ? formatHourLabel(selectedHour) : "—"}</span>
              </div>

              {bookingType === "enroll" && (
                <>
                  <div className="border-t border-border pt-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Course Fee</span>
                    <span className="font-medium text-foreground">₹{courseFee.toLocaleString()}</span>
                  </div>

                  {referralDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Referral Discount
                      </span>
                      <span className="font-medium text-emerald-600">−₹{referralDiscount}</span>
                    </div>
                  )}

                  {walletBalance > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useWallet}
                          onChange={e => setUseWallet(e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-muted-foreground">Use Wallet (₹{walletBalance.toLocaleString()})</span>
                      </label>
                      {useWallet && (
                        <span className="font-medium text-emerald-600">−₹{walletDeduction.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold text-foreground">
                  {bookingType === "enroll" && (referralDiscount > 0 || walletDeduction > 0) ? "You Pay" : "Amount"}
                </span>
                <span className="font-bold text-foreground text-lg">
                  {bookingType === "trial" ? "₹0 (Free)" : `₹${finalAmount.toLocaleString()}`}
                </span>
              </div>
            </div>

            {bookingType === "trial" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-sm text-amber-700 border border-amber-200">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>The trainer has 24 hours to approve your trial request. You'll receive an email with the confirmation.</span>
              </div>
            )}

            {referralDiscount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>₹100 referral discount applied! Your referrer will earn ₹500 once you enroll.</span>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 text-sm text-foreground border border-primary/10">
              <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <span>
                {bookingType === "trial"
                  ? "Your trial request is protected by SkillMitra's quality guarantee."
                  : "Payment is securely processed via Razorpay. Your booking is protected by SkillMitra's quality guarantee."}
              </span>
            </div>

            {hasMissingProfile && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Quick details to confirm your booking</p>
                    <p className="text-xs text-muted-foreground mt-0.5">We need a few essentials so the trainer can reach you. You can edit these anytime in your profile.</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {missingProfile.full_name && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <Input value={profileFullName} onChange={e => setProfileFullName(e.target.value.replace(/[^a-zA-Z\s.'\-]/g, ""))} placeholder="Your full name" className="mt-1 h-9" />
                    </div>
                  )}
                  {missingProfile.phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone (10-digit)</Label>
                      <Input value={profilePhone} onChange={e => setProfilePhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" className="mt-1 h-9" inputMode="numeric" />
                    </div>
                  )}
                  {missingProfile.city && (
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <Input value={profileCity} onChange={e => setProfileCity(e.target.value.replace(/[^a-zA-Z\s'-]/g, ""))} placeholder="e.g. Hyderabad" className="mt-1 h-9" />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("slot")}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting || savingProfile}>
                {(submitting || savingProfile) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {bookingType === "trial" ? "Send Trial Request" : finalAmount === 0 ? "Enroll Free" : "Pay & Enroll"}
              </Button>
            </div>
          </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentModal;
