const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 'HH:mm' (24h) → '8:00 AM'; '' when unset/invalid. */
export function fmt12(t?: string): string {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return '';
  const [hh, mm] = t.split(':').map(Number);
  const period = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${period}`;
}

/** 'yyyy-MM-dd' → '7 Feb'. */
export function fmtDateShort(d?: string): string {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  return `${day} ${MONTHS[m - 1] ?? ''}`;
}

/** Outstanding balance on a booking. */
export function bookingBalance(b: { totalAmount: number; discount?: number; paidAmount: number }): number {
  return b.totalAmount - (b.discount ?? 0) - b.paidAmount;
}
