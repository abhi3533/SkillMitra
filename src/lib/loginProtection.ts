const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

interface LoginAttemptData {
  count: number;
  lockedUntil: number | null;
}

const getKey = (email: string) => `login-attempts-${email.toLowerCase().trim()}`;

export const checkLoginLocked = (email: string): { locked: boolean; minutesLeft: number } => {
  try {
    const raw = localStorage.getItem(getKey(email));
    if (!raw) return { locked: false, minutesLeft: 0 };
    const data: LoginAttemptData = JSON.parse(raw);
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      const minutesLeft = Math.ceil((data.lockedUntil - Date.now()) / 60000);
      return { locked: true, minutesLeft };
    }
    // Lockout expired, reset
    if (data.lockedUntil && Date.now() >= data.lockedUntil) {
      localStorage.removeItem(getKey(email));
    }
    return { locked: false, minutesLeft: 0 };
  } catch {
    return { locked: false, minutesLeft: 0 };
  }
};

export const recordFailedAttempt = (email: string): { locked: boolean; minutesLeft: number } => {
  try {
    const raw = localStorage.getItem(getKey(email));
    let data: LoginAttemptData = raw ? JSON.parse(raw) : { count: 0, lockedUntil: null };
    
    // Reset if lockout expired
    if (data.lockedUntil && Date.now() >= data.lockedUntil) {
      data = { count: 0, lockedUntil: null };
    }

    data.count += 1;

    if (data.count >= MAX_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
      localStorage.setItem(getKey(email), JSON.stringify(data));
      return { locked: true, minutesLeft: LOCKOUT_MINUTES };
    }

    localStorage.setItem(getKey(email), JSON.stringify(data));
    return { locked: false, minutesLeft: 0 };
  } catch {
    return { locked: false, minutesLeft: 0 };
  }
};

export const clearLoginAttempts = (email: string) => {
  localStorage.removeItem(getKey(email));
};
