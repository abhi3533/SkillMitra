import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("invalid");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setStatus("already");
        } else if (data.valid) {
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) {
        setStatus("error");
      } else if (data?.success) {
        setStatus("success");
      } else if (data?.reason === "already_unsubscribed") {
        setStatus("already");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <span className="text-2xl font-extrabold text-foreground">Skill</span>
          <span className="text-2xl font-extrabold text-primary">Mitra</span>
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Validating your request...</p>
          </div>
        )}

        {status === "valid" && (
          <div className="space-y-4">
            <MailX className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Unsubscribe from emails?</h1>
            <p className="text-muted-foreground text-sm">
              You'll stop receiving app notification emails from SkillMitra. Important account
              emails (password resets, verification) will still be delivered.
            </p>
            <Button onClick={handleUnsubscribe} variant="destructive" className="w-full">
              Confirm Unsubscribe
            </Button>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">You've been unsubscribed</h1>
            <p className="text-muted-foreground text-sm">
              You won't receive any more app notification emails. You can close this page.
            </p>
          </div>
        )}

        {status === "already" && (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Already unsubscribed</h1>
            <p className="text-muted-foreground text-sm">
              You've already unsubscribed from app notification emails.
            </p>
          </div>
        )}

        {(status === "invalid" || status === "error") && (
          <div className="space-y-3">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">
              {status === "invalid" ? "Invalid link" : "Something went wrong"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {status === "invalid"
                ? "This unsubscribe link is invalid or has expired."
                : "We couldn't process your request. Please try again later."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
