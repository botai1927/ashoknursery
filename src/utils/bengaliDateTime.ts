/**
 * Utility for formatting natural Bengali dates and times
 * specifically for Brahmyaman Nursery owner logs and UI timestamps.
 */

export interface BengaliDateTimeInfo {
  fullText: string;
  dateBn: string;
  timeBn: string;
  relativeBn: string;
  iso: string;
}

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string): string {
  return num.toString().replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function getBengaliDateTime(date = new Date()): BengaliDateTimeInfo {
  const day = toBengaliNumber(date.getDate());
  const month = BENGALI_MONTHS[date.getMonth()];
  const year = toBengaliNumber(date.getFullYear());

  let rawHours = date.getHours();
  const rawMinutes = date.getMinutes();

  let period = 'সকাল';
  if (rawHours >= 4 && rawHours < 12) {
    period = 'সকাল';
  } else if (rawHours >= 12 && rawHours < 16) {
    period = 'দুপুর';
  } else if (rawHours >= 16 && rawHours < 19) {
    period = 'বিকাল';
  } else if (rawHours >= 19 && rawHours < 23) {
    period = 'সন্ধ্যা/রাত';
  } else {
    period = 'রাত';
  }

  let displayHours = rawHours;
  if (displayHours > 12) displayHours -= 12;
  if (displayHours === 0) displayHours = 12;

  const hoursBn = toBengaliNumber(displayHours);
  const minutesBn = toBengaliNumber(rawMinutes < 10 ? `0${rawMinutes}` : rawMinutes);

  const dateBn = `${day} ${month}, ${year}`;
  const timeBn = `${period} ${hoursBn}:${minutesBn}`;
  const fullText = `${dateBn} · ${timeBn}`;

  return {
    fullText,
    dateBn,
    timeBn,
    relativeBn: `${timeBn}, ${day} ${month}`,
    iso: date.toISOString(),
  };
}

export function calculateTrashDaysRemaining(deletedAtIso?: string): {
  daysRemaining: number;
  isExpired: boolean;
  daysRemainingBn: string;
} {
  if (!deletedAtIso) {
    return { daysRemaining: 30, isExpired: false, daysRemainingBn: '৩০' };
  }
  const deletedTime = new Date(deletedAtIso).getTime();
  if (isNaN(deletedTime)) {
    return { daysRemaining: 30, isExpired: false, daysRemainingBn: '৩০' };
  }
  const now = Date.now();
  const msInDay = 24 * 60 * 60 * 1000;
  const diffDays = (now - deletedTime) / msInDay;
  const daysRemaining = Math.max(0, Math.ceil(30 - diffDays));
  const isExpired = diffDays >= 30;
  const daysRemainingBn = toBengaliNumber(daysRemaining);
  return { daysRemaining, isExpired, daysRemainingBn };
}

