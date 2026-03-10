// Shared form validation utilities

/** Strip non-digits and return clean phone */
export const cleanPhone = (val: string): string => val.replace(/\D/g, "").slice(0, 10);

/** Validate Indian mobile: 10 digits starting with 6-9 */
export const isValidPhone = (phone: string): boolean => /^[6-9]\d{9}$/.test(cleanPhone(phone));

/** Basic email format check */
export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** Known disposable/temporary email domains */
const disposableDomains = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "yopmail.com", "10minutemail.com", "trashmail.com", "fakeinbox.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "dispostable.com",
  "maildrop.cc", "mailnesia.com", "tempail.com", "tempr.email",
  "discard.email", "discardmail.com", "mailcatch.com", "trash-mail.com",
  "getnada.com", "mohmal.com", "burnermail.io", "temp-mail.org",
]);

/** Check if email uses a disposable/temporary domain */
export const isDisposableEmail = (email: string): boolean => {
  const domain = email.trim().split("@")[1]?.toLowerCase();
  return domain ? disposableDomains.has(domain) : false;
};

/** Common email typo suggestions */
const typoMap: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gnail.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoomail.com": "yahoo.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outloo.com": "outlook.com",
  "outlok.com": "outlook.com",
};

/** Returns typo suggestion or null */
export const getEmailTypoSuggestion = (email: string): string | null => {
  const domain = email.trim().split("@")[1]?.toLowerCase();
  if (!domain) return null;
  const suggestion = typoMap[domain];
  if (suggestion) {
    return `Did you mean ${email.split("@")[0]}@${suggestion}?`;
  }
  return null;
};
