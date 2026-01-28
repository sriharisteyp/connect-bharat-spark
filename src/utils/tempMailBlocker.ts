// List of known temporary email domains
const TEMP_EMAIL_DOMAINS = [
  '10minutemail.com',
  '10minutemail.net',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.org',
  'guerrillamail.net',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'throwaway.email',
  'throwawaymail.com',
  'mailinator.com',
  'mailinator2.com',
  'mailinater.com',
  'mailinator.net',
  'mailinator.org',
  'mailinator.us',
  'sogetthis.com',
  'mailin8r.com',
  'tradermail.info',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'discard.email',
  'discardmail.com',
  'discardmail.de',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'fakeinbox.com',
  'mailnesia.com',
  'tempr.email',
  'tempinbox.com',
  'tempail.com',
  'disposableemailaddresses.com',
  'mintemail.com',
  'mohmal.com',
  'maildrop.cc',
  'getnada.com',
  'e4ward.com',
  'emailondeck.com',
  'tempmailaddress.com',
  'fakemailgenerator.com',
  'emailfake.com',
  'tempmailo.com',
  'burner.kiwi',
  'burnermail.io',
  'temp-mail.io',
  'tempmail.net',
  'tempmail.de',
  'trashmail.com',
  'trashmail.net',
  'trashmail.org',
  'trashmail.ws',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'spamex.com',
  'spamherelots.com',
  'spaml.de',
  'spam4.me',
  'mytrashmail.com',
  'mt2015.com',
  'trash2009.com',
  'bspamfree.org',
  'antispam.de',
  'haltospam.com',
  'kasmail.com',
  'emailsensei.com',
  'sofimail.com',
  'pookmail.com',
  'mailexpire.com',
  'mailmoat.com',
  'filzmail.com',
  'mailcatch.com',
  'inboxalias.com',
  'jetable.org',
  'getairmail.com',
  'dropmail.me',
  'tempmails.net',
  'mailnull.com',
  'spamavert.com',
  'incognitomail.org',
  'incognitomail.com',
  'receiveee.com',
  'throwam.com',
  'tempsky.com',
  'tempemailco.com',
];

export function isTempEmail(email: string): boolean {
  if (!email) return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return TEMP_EMAIL_DOMAINS.some(tempDomain => 
    domain === tempDomain || domain.endsWith(`.${tempDomain}`)
  );
}

export function validateEmailForSignup(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (isTempEmail(email)) {
    return { valid: false, error: 'Temporary email addresses are not allowed. Please use a permanent email.' };
  }

  return { valid: true };
}
