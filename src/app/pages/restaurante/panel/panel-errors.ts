import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

/** User-facing message for a failed panel request. Backend messages are not shown verbatim. */
export function panelErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  switch (error.status) {
    case 0:
      return 'Could not reach the server. Check your connection and try again.';
    case HttpStatusCode.Unauthorized:
      return 'Your session expired. Sign in again.';
    case HttpStatusCode.Forbidden:
      return 'You cannot change this item.';
    case HttpStatusCode.PayloadTooLarge:
      return 'The file is larger than 10 MB.';
    default:
      return fallback;
  }
}

/** Reservation dates come as `yyyy-MM-dd`; parse them as local dates, not UTC midnight. */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
