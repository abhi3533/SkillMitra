declare global {
  interface Window {
    initSendOTP: (config: {
      widgetId: string;
      tokenAuth: string;
      identifier: string;
      exposeMethods: boolean;
      success: (data: any) => void;
      failure: (error: any) => void;
    }) => void;
  }
}

const MSG91_WIDGET_ID = "36636d6c4162343437313830";
const OTP_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function loadMsg91Script(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.initSendOTP === "function") { resolve(); return; }
    if (document.getElementById("msg91-otp-script")) {
      // Script tag exists but may still be loading
      const el = document.getElementById("msg91-otp-script") as HTMLScriptElement;
      el.addEventListener("load", () => resolve());
      el.addEventListener("error", () => reject(new Error("Failed to load OTP widget")));
      return;
    }
    const script = document.createElement("script");
    script.id = "msg91-otp-script";
    script.src = "https://widget.msg91.com/widget/secure.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load OTP widget. Check your internet connection."));
    document.head.appendChild(script);
  });
}

/**
 * Opens the MSG91 OTP widget to verify the given Indian mobile number.
 * Resolves with the MSG91 access token on success.
 * Rejects if OTP fails or times out.
 */
export async function verifyPhoneWithOTP(phone: string): Promise<string> {
  await loadMsg91Script();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("OTP verification timed out. Please try again."));
    }, OTP_TIMEOUT_MS);

    window.initSendOTP({
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: import.meta.env.VITE_MSG91_AUTH_KEY as string,
      identifier: "91" + phone,
      exposeMethods: false,
      success: (data: any) => {
        clearTimeout(timeout);
        // MSG91 returns the access token in data.message or data.token
        resolve(data?.message || data?.token || data?.access_token || "verified");
      },
      failure: (error: any) => {
        clearTimeout(timeout);
        const msg = typeof error === "string" ? error : (error?.message || "OTP verification failed");
        reject(new Error(msg));
      },
    });
  });
}
