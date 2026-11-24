const DAY = 86_400_000;
const MAX_SPAN_DAYS = 31;
const MAX_FUTURE_DAYS = 16; // Open-Meteo forecast limit
const EARLIEST = '1940-01-01'; // Open-Meteo archive starts here

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const isoDay = (d) => d.toISOString().slice(0, 10);

function parseDay(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${label} must use the format YYYY-MM-DD.`);
  }
  const d = new Date(`${value}T00:00:00Z`);
  // Date rolls 2026-02-31 over to March, so compare the round trip.
  if (Number.isNaN(d.getTime()) || isoDay(d) !== value) {
    throw new HttpError(400, `${label} is not a real date.`);
  }
  return d;
}

export function validateRange(start, end) {
  const s = parseDay(start, 'start_date');
  const e = parseDay(end, 'end_date');
  if (s > e) throw new HttpError(400, 'start_date must be on or before end_date.');
  if (start < EARLIEST) throw new HttpError(400, `Dates before ${EARLIEST} are not available.`);

  const limit = new Date(Date.now() + MAX_FUTURE_DAYS * DAY);
  if (e > limit) {
    throw new HttpError(400, `end_date cannot be more than ${MAX_FUTURE_DAYS} days in the future.`);
  }
  if ((e - s) / DAY + 1 > MAX_SPAN_DAYS) {
    throw new HttpError(400, `The date range cannot be longer than ${MAX_SPAN_DAYS} days.`);
  }
}

export function validateText(value, label, max) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${label} is required.`);
  }
  if (value.length > max) throw new HttpError(400, `${label} must be ${max} characters or fewer.`);
  return value.trim();
}
