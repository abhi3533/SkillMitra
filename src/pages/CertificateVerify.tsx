import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Award, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { formatLongDateIST } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

interface CertResult {
  c_certificate_id: string;
  c_course_name: string;
  c_issue_date: string;
  c_is_valid: boolean;
  c_student_id: string;
  c_trainer_id: string;
}

const CertificateVerify = () => {
  const { certificateId } = useParams();
  const [searchId, setSearchId] = useState(certificateId || "");
  const [result, setResult] = useState<CertResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [trainerName, setTrainerName] = useState("");

  usePageMeta({
    title: "Verify Certificate — SkillMitra",
    description: "Verify the authenticity of SkillMitra certificates using the unique certificate ID.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Verify Certificate",
      url: "https://skillmitra.online/verify",
      description: "Verify the authenticity of SkillMitra certificates using the unique certificate ID",
    },
  });

  const verifyCert = async (certId: string) => {
    if (!certId.trim()) return;
    setLoading(true);
    setSearched(true);
    setResult(null);
    setStudentName("");
    setTrainerName("");

    try {
      const { data } = await supabase.rpc("verify_certificate", { cert_id: certId.trim() });
      const cert = data?.[0] || null;
      setResult(cert);

      if (cert) {
        // Fetch names via public RPCs
        const [studentRes, trainerRes] = await Promise.all([
          supabase.from("students").select("user_id").eq("id", cert.c_student_id).single(),
          supabase.from("trainers").select("user_id").eq("id", cert.c_trainer_id).single(),
        ]);
        const userIds = [studentRes.data?.user_id, trainerRes.data?.user_id].filter(Boolean);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.rpc("get_public_profiles_bulk", { profile_ids: userIds });
          (profiles || []).forEach((p: any) => {
            if (p.p_id === studentRes.data?.user_id) setStudentName(p.p_full_name || "Student");
            if (p.p_id === trainerRes.data?.user_id) setTrainerName(p.p_full_name || "Trainer");
          });
        }
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId) verifyCert(certificateId);
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 lg:px-8 pt-28 pb-20">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl hero-gradient flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Certificate Verification</h1>
          <p className="mt-2 text-muted-foreground">Enter a certificate ID to verify its authenticity</p>

          <div className="flex gap-2 mt-6">
            <Input value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="Enter Certificate ID (e.g. SM-A1B2C3D4)" className="h-11" onKeyDown={e => e.key === "Enter" && verifyCert(searchId)} />
            <Button onClick={() => verifyCert(searchId)} disabled={loading} className="hero-gradient border-0 px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
            </Button>
          </div>

          {loading && (
            <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </div>
          )}

          {searched && !loading && result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-card rounded-xl border p-6 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-600">Verified Certificate</p>
                  <p className="text-xs text-muted-foreground">This certificate is genuine and valid</p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {studentName && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Student</span>
                    <span className="text-sm font-medium text-foreground">{studentName}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Course</span>
                  <span className="text-sm font-medium text-foreground">{result.c_course_name || "—"}</span>
                </div>
                {trainerName && (
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Trainer</span>
                    <span className="text-sm font-medium text-foreground">{trainerName}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Issue Date</span>
                  <span className="text-sm font-medium text-foreground">
                    {result.c_issue_date ? new Date(result.c_issue_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Certificate ID</span>
                  <span className="text-sm font-mono text-foreground">{result.c_certificate_id}</span>
                </div>
              </div>
            </motion.div>
          )}

          {searched && !loading && !result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-card rounded-xl border p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <p className="font-semibold text-destructive">Certificate Not Found</p>
              <p className="text-sm text-muted-foreground mt-1">No valid certificate found with this ID. Please check the ID and try again.</p>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CertificateVerify;
