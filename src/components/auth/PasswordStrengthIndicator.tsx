import { Check, X } from "lucide-react";

interface Props {
  password: string;
  confirmPassword?: string;
  showConfirm?: boolean;
}

const rules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "1 uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 number", test: (p: string) => /\d/.test(p) },
  { label: "1 special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=\\[\]/~`]/.test(p) },
];

export const getPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
  const passed = rules.filter(r => r.test(password)).length;
  if (passed <= 2) return "weak";
  if (passed === 3) return "medium";
  return "strong";
};

export const isPasswordValid = (password: string) => rules.every(r => r.test(password));

const PasswordStrengthIndicator = ({ password, confirmPassword, showConfirm }: Props) => {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const colors = { weak: "bg-destructive", medium: "bg-amber-500", strong: "bg-green-500" };
  const labels = { weak: "Weak", medium: "Medium", strong: "Strong" };
  const widths = { weak: "w-1/3", medium: "w-2/3", strong: "w-full" };
  const textColors = { weak: "text-destructive", medium: "text-amber-600", strong: "text-green-600" };

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${widths[strength]} ${colors[strength]}`} />
        </div>
        <span className={`text-xs font-medium ${textColors[strength]}`}>{labels[strength]}</span>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-1">
        {rules.map(rule => {
          const passed = rule.test(password);
          return (
            <div key={rule.label} className="flex items-center gap-1.5 text-xs">
              {passed ? (
                <Check className="w-3 h-3 text-green-600 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
              <span className={passed ? "text-green-600" : "text-muted-foreground"}>{rule.label}</span>
            </div>
          );
        })}
      </div>

      {/* Confirm password match */}
      {showConfirm && confirmPassword !== undefined && confirmPassword.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs">
          {password === confirmPassword ? (
            <>
              <Check className="w-3 h-3 text-green-600 shrink-0" />
              <span className="text-green-600">Passwords match</span>
            </>
          ) : (
            <>
              <X className="w-3 h-3 text-destructive shrink-0" />
              <span className="text-destructive">Passwords do not match</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
