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
  // Additional current disposable domains
  "mailnull.com", "spamgourmet.com", "spamgourmet.net", "spamgourmet.org",
  "spamhereplease.com", "spamthisplease.com", "temporaryemail.net",
  "throwam.com", "throwam.net", "spamfree24.org", "spamfree24.de",
  "spamfree24.eu", "spamfree24.info", "spamfree24.net", "spamfree.eu",
  "spamhole.com", "spaml.de", "spaml.com", "spammotel.com",
  "tempinbox.com", "tempinbox.co.uk", "temp.bartkeith.com",
  "trbvm.com", "trashmailer.com", "trashmail.at", "trashmail.io",
  "trashmail.me", "trashmail.net", "trashmail.xyz",
  "inboxbear.com", "inboxkitten.com", "mytemp.email", "nwldx.com",
  "e4ward.com", "eyepaste.com", "filzmail.com", "fivemail.de",
  "fleckens.hu", "get2mail.fr", "getairmail.com", "getmails.eu",
  "harakirimail.com", "hidemail.de", "hidzz.com", "hmamail.com",
  "ieatspam.eu", "ieatspam.info", "inoutmail.de", "inoutmail.eu",
  "jetable.com", "jetable.fr.nf", "jetable.net", "jetable.org",
  "kasmail.com", "koszmail.pl", "kurzepost.de", "letthemeatspam.com",
  "lol.ovpn.to", "lookugly.com", "lortemail.dk", "m21.cc",
  "mega.zik.dj", "meltmail.com", "mierdamail.com", "mintemail.com",
  "mt2014.com", "mt2015.com", "mx0.wwwnew.eu", "mycleaninbox.net",
  "mymailoasis.com", "mypartyclip.de", "mytempdir.com",
  "netmails.com", "netmails.net", "neverbox.com", "nice-4u.com",
  "nobulk.com", "noclickemail.com", "nogmailspam.info", "nospam.ze.tc",
  "nospamfor.us", "nospammail.net", "notmailinator.com", "nowmymail.com",
  "nus.edu.sg.9.mail.com", "objectmail.com", "odaymail.com",
  "onewaymail.com", "online.ms", "oopi.org", "opentrash.com",
  "owlpic.com", "pecinan.com", "pepbot.com", "pfui.ru",
  "pjjkp.com", "plexolan.de", "pookmail.com", "privacy.net",
  "proxymail.eu", "prtnx.com", "puncak.ns3.name", "putthisinyourspamdatabase.com",
  "qq.com.promo.com", "rklips.com", "rmqkr.net", "rppkn.com",
  "rtrtr.com", "s0ny.net", "safe-mail.net", "safetymail.info",
  "safetypost.de", "sandelf.de", "sharedmailbox.org", "shiftmail.com",
  "shortmail.net", "sibmail.com", "skeefmail.com", "slapsfromlastnight.com",
  "slopsbox.com", "slushmail.com", "smashmail.de", "smellfear.com",
  "snakemail.com", "sneakemail.com", "sneakmail.de", "snkmail.com",
  "sofort-mail.de", "softpls.asia", "sogetthis.com", "soodomail.com",
  "soodonims.com", "spam.la", "spambox.info", "spambox.irishspringrealty.com",
  "spambox.us", "spamcannon.com", "spamcannon.net", "spamcero.com",
  "spamcon.org", "spamcorptastic.com", "spamcowboy.com", "spamcowboy.net",
  "spamcowboy.org", "spamday.com", "spamdecoy.net", "spameater.org",
  "spamex.com", "spamfree.eu", "spamfree24.com", "spamgrap.de",
  "tempsky.com", "tempr.email", "throwam.com",
  "guerrillamailblock.com", "spam4.me", "wegwerfmail.de",
  "wegwerfmail.net", "wegwerfmail.org", "wh4f.org", "whyspam.me",
  "willselfdestruct.com", "wuzupmail.net", "xagloo.co", "xagloo.com",
  "xemaps.com", "xents.com", "xmaily.com", "xoxy.net",
  "yandex.com.promo.com", "yepmail.net", "yert.ye.vc", "yogamaven.com",
  "yopmail.fr", "yopmail.info", "youdontneedto.com", "ypmail.webarnak.fr.eu.org",
  "yuurok.com", "z1p.biz", "za.com", "zebins.com", "zebins.eu",
  "zoemail.net", "zoemail.org", "zomg.info", "zxcv.com",
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
