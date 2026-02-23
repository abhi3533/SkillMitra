import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layouts/AdminLayout";

const AdminStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("students").select("*, profiles(*)").order("created_at", { ascending: false });
      setStudents(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = students.filter(s => {
    const name = s.profiles?.full_name?.toLowerCase() || "";
    const email = s.profiles?.email?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground">Student Management</h1>
      <p className="mt-1 text-muted-foreground">All registered students</p>

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
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Joined</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No students found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">{s.profiles?.full_name?.[0] || "S"}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.profiles?.city || "-"}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{s.total_sessions_attended}</td>
                  <td className="px-4 py-3 text-sm text-foreground">₹{Number(s.total_spent || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;
