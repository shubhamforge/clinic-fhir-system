export interface VitalReading {
  value: number;
  unit: string;
  date: string;
}

export interface VitalsSnapshot {
  systolic?: VitalReading;
  diastolic?: VitalReading;
  weight?: VitalReading;
  spo2?: VitalReading;
}

export interface EncounterItem {
  id: string;
  date: string;
  reason: string;
  status: string;
}

export interface PatientSummary {
  id: string;
  name: string;
  dob: string;
  gender: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  encounters: EncounterItem[];
  vitals: VitalsSnapshot;
}
