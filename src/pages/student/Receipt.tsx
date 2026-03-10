import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/layouts/StudentLayout";
import PaymentReceipt from "@/components/PaymentReceipt";

const Receipt = () => {
  const { enrollmentId } = useParams();
  const { user } = useAuth();
  const [receiptData, setReceiptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !enrollmentId) return;

    const fetchReceipt = async () => {
      try {
        // Get student record
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!student) {
          setError("Student record not found.");
          setLoading(false);
          return;
        }

        // Get enrollment with course and trainer
        const { data: enrollment, error: enrollErr } = await supabase
          .from("enrollments")
          .select("*")
          .eq("id", enrollmentId)
          .eq("student_id", student.id)
          .single();

        if (enrollErr || !enrollment) {
          setError("Enrollment not found or access denied.");
          setLoading(false);
          return;
        }

        // Get course info
        const { data: course } = await supabase
          .from("courses")
          .select("title, total_sessions")
          .eq("id", enrollment.course_id)
          .single();

        // Get trainer profile
        const { data: trainer } = await supabase
          .from("trainers")
          .select("user_id")
          .eq("id", enrollment.trainer_id)
          .single();

        let trainerName = "Trainer";
        if (trainer?.user_id) {
          const { data: profiles } = await supabase.rpc("get_public_profile", { profile_id: trainer.user_id });
          if (profiles && profiles.length > 0) {
            trainerName = profiles[0].p_full_name || "Trainer";
          }
        }

        // Get student profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        // Get payment info
        const { data: payment } = await supabase
          .from("payments")
          .select("razorpay_payment_id")
          .eq("enrollment_id", enrollmentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Generate receipt number from enrollment ID
        const receiptNumber = `SM-${enrollmentId.slice(0, 8).toUpperCase()}`;

        setReceiptData({
          receiptNumber,
          date: enrollment.enrollment_date || new Date().toISOString(),
          studentName: profile?.full_name || "Student",
          studentEmail: profile?.email || user.email || "",
          courseName: course?.title || "Course",
          trainerName,
          totalSessions: enrollment.sessions_total || course?.total_sessions || 1,
          amountPaid: Number(enrollment.amount_paid) || 0,
          platformCommission: Number(enrollment.platform_commission) || 0,
          trainerPayout: Number(enrollment.trainer_payout) || 0,
          paymentId: payment?.razorpay_payment_id || undefined,
          enrollmentStatus: enrollment.status || "active",
        });
      } catch (err) {
        console.error("Receipt fetch error:", err);
        setError("Failed to load receipt.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [user, enrollmentId]);

  return (
    <StudentLayout>
      <div className="mb-6">
        <Link to="/student/courses">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Courses
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Payment Receipt</h1>
        <p className="text-muted-foreground text-sm mt-1">Download or print your enrollment receipt</p>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border p-8 animate-pulse h-96" />
      ) : error ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <p className="text-destructive font-medium">{error}</p>
          <Link to="/student/courses">
            <Button className="mt-4" variant="outline">Go to Courses</Button>
          </Link>
        </div>
      ) : receiptData ? (
        <PaymentReceipt data={receiptData} />
      ) : null}
    </StudentLayout>
  );
};

export default Receipt;
