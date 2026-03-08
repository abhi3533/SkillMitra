import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Award, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const StudentCertificates = () => {
  const { user, profile } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).single();
      if (!student) { setLoading(false); return; }
      setStudentId(student.id);
      const { data } = await supabase.from("certificates").select("*").eq("student_id", student.id).order("issue_date", { ascending: false });
      setCerts(data || []);
      setLoading(false);
    })();
  }, [user]);

  const downloadProgressReport = async () => {
    if (!studentId) return;
    setGenerating(true);

    try {
      // Fetch reflections
      const { data: reflections } = await supabase
        .from("session_reflections")
        .select("*, course_sessions(session_number, title, scheduled_at, trainer_id)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true });

      const refs = reflections || [];
      const name = profile?.full_name || "Student";
      const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

      // Build HTML for printing
      const avgConfidence = refs.length > 0 ? (refs.reduce((s, r) => s + r.confidence_level, 0) / refs.length).toFixed(1) : "N/A";

      let sessionsHtml = refs.map((r, i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${i + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${r.course_sessions?.title || `Session #${r.course_sessions?.session_number || i + 1}`}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${new Date(r.created_at).toLocaleDateString("en-IN")}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${"⭐".repeat(r.confidence_level)}${"☆".repeat(5 - r.confidence_level)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${r.learned_today}</td>
        </tr>
      `).join("");

      const html = `<!DOCTYPE html><html><head><title>Progress Report - ${name}</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#1A56DB}table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f0f4ff;padding:10px;text-align:left;font-size:13px}td{font-size:13px}.stat{display:inline-block;padding:15px 25px;background:#f8fafc;border-radius:8px;margin:5px;text-align:center}.stat-value{font-size:24px;font-weight:bold;color:#1A56DB}.stat-label{font-size:11px;color:#666;margin-top:4px}@media print{body{padding:20px}}</style>
      </head><body>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <h1 style="margin:0">📊 Progress Report</h1>
        </div>
        <p><strong>Student:</strong> ${name} | <strong>Generated:</strong> ${date}</p>
        <hr style="border:1px solid #e5e7eb;margin:15px 0">

        <div style="margin:20px 0">
          <div class="stat"><div class="stat-value">${refs.length}</div><div class="stat-label">Sessions Reflected</div></div>
          <div class="stat"><div class="stat-value">${avgConfidence}</div><div class="stat-label">Avg Confidence</div></div>
          <div class="stat"><div class="stat-value">${certs.length}</div><div class="stat-label">Certificates</div></div>
        </div>

        <h2>Session Reflections</h2>
        <table>
          <thead><tr><th>#</th><th>Session</th><th>Date</th><th>Confidence</th><th>What I Learned</th></tr></thead>
          <tbody>${sessionsHtml || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#999">No reflections yet</td></tr>'}</tbody>
        </table>

        <div style="margin-top:30px;padding:15px;background:#f0f4ff;border-radius:8px">
          <p style="margin:0;font-size:12px;color:#666">This report was generated from SkillMitra — India's #1 Personal 1:1 Training Platform</p>
        </div>
      </body></html>`;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <StudentLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your earned certificates and progress reports</p>
        </div>
        {studentId && (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadProgressReport} disabled={generating}>
            <Download className="w-3.5 h-3.5" /> {generating ? "Generating..." : "Progress Report"}
          </Button>
        )}
      </div>
      <div className="mt-6">
        {loading ? <p className="text-muted-foreground">Loading...</p> :
          certs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-2">No certificates earned yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete a course to earn your first certificate</p>
            </div>
          ) : certs.map(c => (
            <div key={c.id} className="bg-card rounded-xl border p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{c.course_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {c.certificate_id} • Score: {c.overall_score}</p>
                </div>
                <Award className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          ))
        }
      </div>
    </StudentLayout>
  );
};

export default StudentCertificates;
