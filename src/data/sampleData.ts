// On mobile, Supabase is always the source of truth, so the offline sample/demo
// data path in useStore is never taken. This stub satisfies the import and the
// spread shape without pulling in web-only image assets.
import type {
  Vehicle, Owner, Booking, Inquiry, Commission, Expense, Driver, Notification,
} from '../types';

export const sampleData: {
  vehicles: Vehicle[]; owners: Owner[]; bookings: Booking[]; inquiries: Inquiry[];
  commissions: Commission[]; expenses: Expense[]; drivers: Driver[]; notifications: Notification[];
} = {
  vehicles: [], owners: [], bookings: [], inquiries: [],
  commissions: [], expenses: [], drivers: [], notifications: [],
};
