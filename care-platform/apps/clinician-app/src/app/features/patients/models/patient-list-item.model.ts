export interface PatientListItem {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  dob: string; // ISO date e.g. "1980-05-15"
  lastEncounter?: string; // ISO date — not returned by /api/patients, reserved for future
  status: 'active' | 'inactive';
}
