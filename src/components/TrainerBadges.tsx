import { BadgeCheck, ShieldCheck, Briefcase, Video, Award } from "lucide-react";

export interface TrainerBadgeInfo {
  key: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

/**
 * Compute which badges a trainer qualifies for based on their data.
 * Works for both DB trainer objects and signup form data.
 */
export const getTrainerBadges = (trainer: {
  govt_id_type?: string | null;
  aadhaar_url?: string | null;
  
  intro_video_url?: string | null;
  experience_years?: number | null;
  total_students?: number | null;
  // Also check for document-based flags
  hasExperienceDocs?: boolean;
  hasAadhaar?: boolean;
  
}): TrainerBadgeInfo[] => {
  const badges: TrainerBadgeInfo[] = [];

  // ID Verified — has aadhaar or govt ID uploaded
  if (trainer.aadhaar_url || trainer.govt_id_type || trainer.hasAadhaar) {
    badges.push({
      key: "id_verified",
      label: "ID Verified",
      icon: <ShieldCheck className="w-3 h-3" />,
      colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    });
  }

  // Industry Professional — has experience documents
  if (trainer.hasExperienceDocs || (trainer.experience_years && trainer.experience_years >= 2)) {
    badges.push({
      key: "industry_pro",
      label: "Industry Professional",
      icon: <Briefcase className="w-3 h-3" />,
      colorClass: "bg-blue-100 text-blue-700 border-blue-200",
    });
  }

  // Video Verified — has intro video uploaded
  if (trainer.intro_video_url) {
    badges.push({
      key: "video_verified",
      label: "Video Verified",
      icon: <Video className="w-3 h-3" />,
      colorClass: "bg-purple-100 text-purple-700 border-purple-200",
    });
  }

  // Top Mentor — after 10+ sessions (total_students as proxy, or could be sessions)
  if (trainer.total_students && trainer.total_students >= 10) {
    badges.push({
      key: "top_mentor",
      label: "Top Mentor",
      icon: <Award className="w-3 h-3" />,
      colorClass: "bg-amber-100 text-amber-700 border-amber-200",
    });
  }

  return badges;
};

interface TrainerBadgesProps {
  badges: TrainerBadgeInfo[];
  size?: "sm" | "md";
  maxShow?: number;
}

const TrainerBadges = ({ badges, size = "sm", maxShow }: TrainerBadgesProps) => {
  if (!badges.length) return null;
  const shown = maxShow ? badges.slice(0, maxShow) : badges;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(b => (
        <span
          key={b.key}
          className={`inline-flex items-center gap-1 border rounded-full font-medium ${b.colorClass} ${
            size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1"
          }`}
        >
          {b.icon}
          {b.label}
        </span>
      ))}
    </div>
  );
};

export default TrainerBadges;
