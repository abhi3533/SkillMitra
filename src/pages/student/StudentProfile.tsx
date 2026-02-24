import { useAuth } from "@/hooks/useAuth";
import StudentLayout from "@/components/layouts/StudentLayout";

const StudentProfile = () => {
  const { profile } = useAuth();

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
      <div className="mt-6 bg-card rounded-xl border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-2xl">{profile?.full_name?.[0] || "U"}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">{profile?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground ml-2">{profile?.phone || "-"}</span></div>
          <div><span className="text-muted-foreground">City:</span> <span className="text-foreground ml-2">{profile?.city || "-"}</span></div>
          <div><span className="text-muted-foreground">State:</span> <span className="text-foreground ml-2">{profile?.state || "-"}</span></div>
          <div><span className="text-muted-foreground">Gender:</span> <span className="text-foreground ml-2">{profile?.gender || "-"}</span></div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
