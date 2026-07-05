import { Vehicle } from '../types';

/** Returns true only when all four insurance fields are filled in.
 *  (Ported pure helper — the web app's SMS/localStorage reminder loop is
 *  intentionally left out of the mobile client.) */
export function isInsuranceComplete(v: Pick<Vehicle, 'insurance'>): boolean {
  const ins = v.insurance;
  return !!(
    ins?.provider?.trim() &&
    ins?.policyNumber?.trim() &&
    ins?.expiryDate?.trim() &&
    (ins?.premium ?? 0) > 0
  );
}
