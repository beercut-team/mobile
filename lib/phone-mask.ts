/**
 * Formats a raw digit string into +7 (XXX) XXX-XX-XX
 * Accepts input with or without +7 prefix.
 */
export function applyPhoneMask(raw: string): string {
  // Strip everything except digits
  let digits = raw.replace(/\D/g, '');

  // Normalize: if starts with 8, replace with 7; if no leading 7, prepend it
  if (digits.startsWith('8') && digits.length > 1) {
    digits = '7' + digits.slice(1);
  }
  if (!digits.startsWith('7') && digits.length > 0) {
    digits = '7' + digits;
  }

  // Limit to 11 digits (7 + 10)
  digits = digits.slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length === 1) return '+7';

  let result = '+7';
  const rest = digits.slice(1); // up to 10 digits

  if (rest.length > 0) {
    result += ' (' + rest.slice(0, 3);
  }
  if (rest.length >= 3) {
    result += ') ';
  }
  if (rest.length > 3) {
    result += rest.slice(3, 6);
  }
  if (rest.length > 6) {
    result += '-' + rest.slice(6, 8);
  }
  if (rest.length > 8) {
    result += '-' + rest.slice(8, 10);
  }

  return result;
}

/**
 * Strips mask, returns raw digits like 79001234567
 */
export function unmaskPhone(masked: string): string {
  return masked.replace(/\D/g, '');
}

/**
 * Checks if phone has exactly 11 digits (7 + 10)
 */
export function isPhoneComplete(masked: string): boolean {
  return unmaskPhone(masked).length === 11;
}
