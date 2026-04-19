import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, RefreshCw, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LiveSelfieCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => Promise<void> | void;
}

const LiveSelfieCapture = ({ open, onClose, onCapture }: LiveSelfieCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setError(null);
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      setError(err?.name === "NotAllowedError"
        ? "Camera access denied. Please allow camera permission and try again."
        : "Unable to access camera. Make sure your device has a working camera.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPreview(null);
      startCamera();
    } else {
      stopStream();
      setPreview(null);
    }
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPreview(canvas.toDataURL("image/jpeg", 0.92));
    stopStream();
  };

  const handleRetake = async () => {
    setPreview(null);
    await startCamera();
  };

  const handleConfirm = async () => {
    if (!canvasRef.current) return;
    setSubmitting(true);
    try {
      const blob: Blob | null = await new Promise(resolve =>
        canvasRef.current!.toBlob(b => resolve(b), "image/jpeg", 0.92)
      );
      if (!blob) throw new Error("Capture failed");
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
      await onCapture(file);
      onClose();
    } catch (err) {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-4 h-4" /> Take Live Selfie
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {error ? (
              <div className="p-4 text-center text-sm text-destructive">{error}</div>
            ) : preview ? (
              <img src={preview} alt="Selfie preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                {starting && <Loader2 className="absolute w-6 h-6 animate-spin text-muted-foreground" />}
              </>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-[11px] text-muted-foreground text-center">
            Live capture only — used by admin reviewers for identity verification.
          </p>
          <div className="flex gap-2">
            {error ? (
              <Button onClick={startCamera} className="flex-1" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </Button>
            ) : preview ? (
              <>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleRetake} disabled={submitting}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retake
                </Button>
                <Button size="sm" className="flex-1" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Saving...</> : "Use this selfie"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button size="sm" className="flex-1" onClick={handleCapture} disabled={starting || !!error}>
                  <Camera className="w-3.5 h-3.5 mr-1" /> Capture
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveSelfieCapture;
