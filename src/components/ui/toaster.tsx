import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

const variantIcons = {
  default: null,
  destructive: <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />,
  info: <Info className="h-5 w-5 text-white shrink-0 mt-0.5" />,
  success: <CheckCircle2 className="h-5 w-5 text-white shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-900 shrink-0 mt-0.5" />,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={4000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variantIcons[(variant as keyof typeof variantIcons) || "default"];
        return (
          <Toast key={id} variant={variant} {...props}>
            {icon}
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action}
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
