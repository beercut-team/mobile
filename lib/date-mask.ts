/**
 * Formats a raw digit string into DD.MM.YYYY
 * Automatically adds dots after day and month.
 */
export function applyDateMask(raw: string, previousValue: string = ''): string {
  // Strip everything except digits
  let digits = raw.replace(/\D/g, '');
  const prevDigits = previousValue.replace(/\D/g, '');

  // Detect if user is deleting
  const isDeleting = digits.length < prevDigits.length;

  // Allow complete deletion
  if (digits.length === 0) return '';

  // Limit to 8 digits (DDMMYYYY)
  digits = digits.slice(0, 8);

  // Build the mask progressively
  let result = '';

  // Day (DD)
  if (digits.length > 0) {
    result += digits.slice(0, 2);
  }

  // Add dot after day if we have month digits
  if (digits.length >= 3) {
    result += '.' + digits.slice(2, 4);
  }

  // Add dot after month if we have year digits
  if (digits.length >= 5) {
    result += '.' + digits.slice(4, 8);
  }

  return result;
}

/**
 * Checks if the date string is a valid calendar date.
 * Expects format: DD.MM.YYYY
 */
export function isDateValid(dateString: string): boolean {
  // Check format length
  if (dateString.length !== 10) return false;

  // Extract parts
  const parts = dateString.split('.');
  if (parts.length !== 3) return false;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  // Basic range checks
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  if (year < 1900 || year > 2100) return false;

  // Check days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return false;

  // Verify the date is actually valid by creating a Date object
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Checks if the date is in the future.
 * Expects format: DD.MM.YYYY
 */
export function isDateInFuture(dateString: string): boolean {
  if (!isDateValid(dateString)) return false;

  const parts = dateString.split('.');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only dates

  return inputDate > today;
}

/**
 * Checks if date string is complete (10 characters)
 */
export function isDateComplete(dateString: string): boolean {
  return dateString.length === 10;
}
