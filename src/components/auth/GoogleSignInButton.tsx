import { useState } from "react";
import { Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

interface GoogleSignInButtonProps {
  label?: string;
}

const GoogleSignInButton = ({ label = "Sign in with Google" }: GoogleSignInButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast({
          title: "Google sign-in failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast({
        title: "Google sign-in failed",
        description: "Unable to connect to Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      {label}
    </button>
  );
};

export default GoogleSignInButton;
