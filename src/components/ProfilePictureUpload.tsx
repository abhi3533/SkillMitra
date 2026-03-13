import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfilePictureUploadProps {
  userId: string;
  currentUrl: string | null;
  fullName: string;
  size?: "sm" | "md" | "lg";
  onUpload?: (url: string) => void;
}

const sizeClasses = {
  sm: "w-12 h-12 text-lg",
  md: "w-16 h-16 text-2xl",
  lg: "w-24 h-24 text-3xl",
};

const ProfilePictureUpload = ({ userId, currentUrl, fullName, size = "md", onUpload }: ProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const initials = (fullName || "U").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // Read the first 12 bytes of the file and verify they match a known image magic number.
  // This prevents a file named "evil.exe" with type="image/jpeg" from being uploaded.
  const validateImageMagicBytes = (file: File): Promise<boolean> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const bytes = new Uint8Array(e.target?.result as ArrayBuffer);
        const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
        const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
        const isGif  = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
        const isWebP = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
        resolve(isJpeg || isPng || isGif || isWebP);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 12));
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "warning" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "warning" });
      return;
    }

    const isValidImage = await validateImageMagicBytes(file);
    if (!isValidImage) {
      toast({ title: "Invalid file", description: "File content does not match an image format.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("profile-pictures")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", userId);
      if (updateErr) throw updateErr;

      setImageUrl(publicUrl);
      onUpload?.(publicUrl);
      toast({ title: "Profile picture updated!", variant: "success" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-border`}>
        {imageUrl ? (
          <img src={imageUrl} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-primary font-bold">{initials}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePictureUpload;
