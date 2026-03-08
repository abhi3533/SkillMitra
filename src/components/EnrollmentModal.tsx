import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Calendar, Shield, Loader2, AlertCircle } from "lucide-react";
import { generateMeetLink } from "@/lib/meetingLink";

interface EnrollmentModalProps {
  open: boolean;
  onClose: () => void;
  course: any;
  trainer: any;
  trainerProfile: any;
  studentId: string;
  hasTrialBooked: boolean;
}

const TIME_SLOTS = [
  { label: "Early Morning", time: "06:00", display: "6:00 AM – 9:00 AM" },
  { label: "Morning", time: "09:00", display: "9:00 AM – 12:00 PM" },
  { label: "Afternoon", time: "12:00", display: "12:00 PM – 4:00 PM" },
  { label: "Evening", time: "16:00", display: "4:00 PM – 8:00 PM" },
  { label: "Night", time: "20:00", display: "8:00 PM – 11:00 PM" },
];

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

const EnrollmentModal = ({ open, onClose, course, trainer, trainerProfile, studentId, hasTrialBooked }: EnrollmentModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"type" | "slot" | "confirm">("type");
  const [bookingType, setBookingType] = useState<"trial" | "enroll">(hasTrialBooked ? "enroll" : "trial");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [trainerAvailability, setTrainerAvailability] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (trainer?.id && !trainer.id.startsWith("demo-")) {
      supabase.from("trainer_availability").select("*")
        .eq("trainer_id", trainer.id).eq("is_available", true)
        .then(({ data }) => setTrainerAvailability(data || []));
    }
  }, [trainer?.id]);

  const availableDays = trainerAvailability.length > 0
    ? [...new Set(trainerAvailability.map(a => a.day_of_week))].sort()
    : DAYS.map(d => d.value);

  const availableSlots = trainerAvailability.length > 0 && selectedDay !== null
    ? TIME_SLOTS.filter(slot => {
        const slotHour = parseInt(slot.time.split(":")[0]);
        return trainerAvailability.some(a => {
          if (a.day_of_week !== selectedDay) return false;
          const startH = parseInt(a.start_time?.split(":")[0] || "0");
          const endH = parseInt(a.end_time?.split(":")[0] || "24");
          return slotHour >= startH && slotHour < endH;
        });
      })
    : TIME_SLOTS;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (course.id?.startsWith("demo-")) {
        toast({ title: "Demo Course", description: "This is a demo course. Sign up to enroll in real courses!", variant: "default" });
        onClose();
        return;
      }

      // Create enrollment
      const { data: enrollment, error: enrollError } = await supabase.from("enrollments").insert({
        student_id: studentId,
        course_id: course.id,
        trainer_id: trainer.id,
        status: bookingType === "trial" ? "trial" : "active",
        amount_paid: bookingType === "trial" ? 0 : Number(course.course_fee),
        sessions_total: course.total_sessions || 1,
        start_date: new Date().toISOString().split("T")[0],
      }).select().single();

      if (enrollError) throw enrollError;

      // Create the first session (trial or regular)
      const scheduledDate = getNextScheduledDate(selectedDay, selectedSlot);
      const { error: sessionError } = await supabase.from("course_sessions").insert({
        enrollment_id: enrollment.id,
        trainer_id: trainer.id,
        title: bookingType === "trial" ? `Free Trial: ${course.title}` : `Session 1: ${course.title}`,
        session_number: 1,
        is_trial: bookingType === "trial",
        scheduled_at: scheduledDate.toISOString(),
        duration_mins: course.session_duration_mins || 60,
        status: "upcoming",
      });

      if (sessionError) throw sessionError;

      // Create notification for trainer
      await supabase.from("notifications").insert({
        user_id: trainer.user_id,
        title: bookingType === "trial" ? "New Trial Booking!" : "New Enrollment!",
        body: `A student has ${bookingType === "trial" ? "booked a free trial" : "enrolled"} in "${course.title}"`,
        type: bookingType === "trial" ? "trial_booking" : "enrollment",
        action_url: "/trainer/sessions",
      });

      toast({
        title: bookingType === "trial" ? "Trial Booked!" : "Enrolled Successfully!",
        description: bookingType === "trial"
          ? "Your free trial session has been scheduled. Check your sessions page for details."
          : "You're now enrolled. Your first session has been scheduled.",
      });

      onClose();
      navigate("/student/sessions");
    } catch (err: any) {
      console.error("Enrollment error:", err);
      toast({ title: "Error", description: err.message || "Failed to complete booking. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getNextScheduledDate = (day: number | null, slotLabel: string): Date => {
    const now = new Date();
    const slot = TIME_SLOTS.find(s => s.label === slotLabel);
    const hour = slot ? parseInt(slot.time.split(":")[0]) : 10;

    // Find next occurrence of selected day
    const targetDay = day ?? ((now.getDay() + 2) % 7); // default to day after tomorrow
    let daysUntil = targetDay - now.getDay();
    if (daysUntil <= 1) daysUntil += 7; // at least 2 days from now

    const scheduled = new Date(now);
    scheduled.setDate(now.getDate() + daysUntil);
    scheduled.setHours(hour, 0, 0, 0);
    return scheduled;
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
            {course.has_free_trial && !hasTrialBooked && (
              <button
                onClick={() => { setBookingType("trial"); setStep("slot"); }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-primary/50 ${
                  bookingType === "trial" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Free Trial Session</p>
                    <p className="text-sm text-muted-foreground mt-1">Try a session before enrolling — no payment needed</p>
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

            {hasTrialBooked && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You've already used your free trial with this trainer.</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Time Slot Selection */}
        {step === "slot" && (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Preferred Day
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.filter(d => availableDays.includes(d.value)).map(d => (
                  <button key={d.value} onClick={() => { setSelectedDay(d.value); setSelectedSlot(""); }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedDay === d.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/30"
                    }`}
                  >{d.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Preferred Time Slot
              </label>
              <div className="space-y-2">
                {(selectedDay !== null ? availableSlots : TIME_SLOTS).map(slot => (
                  <button key={slot.label} onClick={() => setSelectedSlot(slot.label)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors ${
                      selectedSlot === slot.label
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="font-medium">{slot.label}</span>
                    <span className="ml-2 opacity-70">({slot.display})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>Back</Button>
              <Button className="flex-1" disabled={!selectedSlot}
                onClick={() => setStep("confirm")}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirm" && (
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
                <span className="font-medium text-foreground">{bookingType === "trial" ? "Free Trial" : "Full Enrollment"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Day</span>
                <span className="font-medium text-foreground">{DAYS.find(d => d.value === selectedDay)?.label || "Auto-selected"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time Slot</span>
                <span className="font-medium text-foreground">{selectedSlot}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold text-foreground">Amount</span>
                <span className="font-bold text-foreground text-lg">
                  {bookingType === "trial" ? "₹0 (Free)" : `₹${Number(course.course_fee).toLocaleString()}`}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 text-sm text-foreground border border-primary/10">
              <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <span>Your booking is protected by SkillMitra's quality guarantee. If you're not satisfied, reach out to us for support.</span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("slot")}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {bookingType === "trial" ? "Confirm Trial" : "Confirm & Pay"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnrollmentModal;
