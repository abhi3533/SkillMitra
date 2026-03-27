import { useState, useEffect } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Search, Eye, Pencil, ShieldOff, Trash2, RefreshCw, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminStudents = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewTarget, setViewTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [removeTarget, setRemoveTarget] = useState<any>(null);

  const [editForm, setEditForm] = useState({ full_name: "", phone: "", city: "", course_interests: "" });
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    const { data: studentData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (!studentData || studentData.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }
    const userIds = studentData.map(s => s.user_id);
    const { data: profileData } = await supabase.rpc("get_public_profiles_bulk", { profile_ids: userIds });
    const profileMap: Record<string, any> = {};
    (profileData || []).forEach((p: any) => {
      profileMap[p.p_id] = { full_name: p.p_full_name, email: null, city: p.p_city, profile_picture_url: p.p_profile_picture_url };
    });
    const { data: emailData } = await supabase.from("profiles").select("id, email, phone, is_active").in("id", userIds);
    (emailData || []).forEach((p: any) => {
      if (profileMap[p.id]) {
        profileMap[p.id].email = p.email;
        profileMap[p.id].phone = p.phone;
        profileMap[p.id].is_active = p.is_active;
      } else {
        profileMap[p.id] = { full_name: null, email: p.email, phone: p.phone, city: null, is_active: p.is_active };
      }
    });
    const merged = studentData.map(s => ({ ...s, profiles: profileMap[s.user_id] || {} }));
    setStudents(merged);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const openEdit = (student: any) => {
    setEditForm({
      full_name: student.profiles?.full_name || "",
      phone: student.profiles?.phone || "",
      city: student.profiles?.city || "",
      course_interests: (student.course_interests || []).join(", "),
    });
    setEditTarget(student);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const { error: profileErr } = await supabase.from("profiles").update({
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        city: editForm.city.trim() || null,
      }).eq("id", editTarget.user_id);
      if (profileErr) throw profileErr;

      const interests = editForm.course_interests.split(",").map(s => s.trim()).filter(Boolean);
      const { error: studentErr } = await supabase.from("students").update({
        course_interests: interests,
      }).eq("id", editTarget.id);
      if (studentErr) throw studentErr;

      toast({ title: "Student updated", description: "Changes saved successfully." });
      setEditTarget(null);
      fetchStudents();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    const isCurrentlyActive = suspendTarget.profiles?.is_active !== false;
    const { error } = await supabase.from("profiles").update({ is_active: !isCurrentlyActive }).eq("id", suspendTarget.user_id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: isCurrentlyActive ? "Student suspended" : "Student reactivated", description: `Account has been ${isCurrentlyActive ? "suspended" : "reactivated"}.` });
      fetchStudents();
    }
    setSuspendTarget(null);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    const studentName = removeTarget.profiles?.full_name || "Student";
    const userId = removeTarget.user_id;
    const { error } = await supabase.from("students").delete().eq("id", removeTarget.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setRemoveTarget(null);
      return;
    }
    if (userId) {
      supabase.functions.invoke("delete-auth-user", { body: { user_id: userId } }).catch(console.error);
    }
    toast({ title: "Student removed", description: `${studentName} has been permanently removed.` });
    setStudents(prev => prev.filter(s => s.id !== removeTarget.id));
    setRemoveTarget(null);
  };

  const filtered = students.filter(s => {
    const name = s.profiles?.full_name?.toLowerCase() || "";
    const email = s.profiles?.email?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">All registered students ({students.length})</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={fetchStudents} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-10" />
      </div>

      <div className="mt-4 bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-secondary/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Student</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">City</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Sessions</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Spent</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No students found</td></tr>
              ) : filtered.map(s => {
                const isActive = s.profiles?.is_active !== false;
                return (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-bold">{s.profiles?.full_name?.[0] || "S"}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.profiles?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{s.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.profiles?.city || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{s.total_sessions_attended}</td>
                    <td className="px-4 py-3 text-sm text-foreground">₹{Number(s.total_spent || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                        {isActive ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateIST(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewTarget(s)} title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-orange-600" onClick={() => setSuspendTarget(s)} title={isActive ? "Suspend" : "Reactivate"}>
                          {isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setRemoveTarget(s)} title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Sheet */}
      <Sheet open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Student Details</SheetTitle>
          </SheetHeader>
          {viewTarget && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full hero-gradient flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">{viewTarget.profiles?.full_name?.[0] || "S"}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{viewTarget.profiles?.full_name || "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground">{viewTarget.profiles?.email}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${viewTarget.profiles?.is_active !== false ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                    {viewTarget.profiles?.is_active !== false ? "Active" : "Suspended"}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Phone:</span> <span className="ml-1">{viewTarget.profiles?.phone || "-"}</span></div>
                <div><span className="text-muted-foreground">City:</span> <span className="ml-1">{viewTarget.profiles?.city || "-"}</span></div>
                <div><span className="text-muted-foreground">Sessions:</span> <span className="ml-1">{viewTarget.total_sessions_attended || 0}</span></div>
                <div><span className="text-muted-foreground">Total Spent:</span> <span className="ml-1">₹{Number(viewTarget.total_spent || 0).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Education:</span> <span className="ml-1">{viewTarget.education_level?.replace(/_/g, " ") || "-"}</span></div>
                <div><span className="text-muted-foreground">College:</span> <span className="ml-1">{viewTarget.college_name || "-"}</span></div>
                <div><span className="text-muted-foreground">Graduation:</span> <span className="ml-1">{viewTarget.graduation_year || "-"}</span></div>
                <div><span className="text-muted-foreground">Experience:</span> <span className="ml-1">{viewTarget.skill_experience?.replace(/_/g, " ") || "-"}</span></div>
                <div><span className="text-muted-foreground">Referral Code:</span> <span className="ml-1">{viewTarget.referral_code || "-"}</span></div>
                <div><span className="text-muted-foreground">Credits:</span> <span className="ml-1">₹{Number(viewTarget.referral_credits || 0).toLocaleString()}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Joined:</span> <span className="ml-1">{formatDateIST(viewTarget.created_at)}</span></div>
              </div>
              {viewTarget.course_interests?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Course Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewTarget.course_interests.map((i: string) => (
                        <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {viewTarget.skills_learning?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Skills Learning</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewTarget.skills_learning.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Course Interests (comma-separated)</Label>
              <Input value={editForm.course_interests} onChange={e => setEditForm(f => ({ ...f, course_interests: e.target.value }))} className="mt-1" placeholder="Python, React, Data Science" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={() => setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{suspendTarget?.profiles?.is_active !== false ? "Suspend" : "Reactivate"} Student</DialogTitle>
            <DialogDescription>
              {suspendTarget?.profiles?.is_active !== false
                ? <>Are you sure you want to suspend <strong>{suspendTarget?.profiles?.full_name || "this student"}</strong>? They will not be able to access the platform.</>
                : <>Are you sure you want to reactivate <strong>{suspendTarget?.profiles?.full_name || "this student"}</strong>?</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancel</Button>
            <Button className={suspendTarget?.profiles?.is_active !== false ? "bg-orange-600 hover:bg-orange-700" : "bg-emerald-600 hover:bg-emerald-700"} onClick={handleSuspend}>
              {suspendTarget?.profiles?.is_active !== false ? "Suspend" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Dialog */}
      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeTarget?.profiles?.full_name || "this student"}</strong>? This action cannot be undone. The student will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemove}>Remove Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminStudents;
