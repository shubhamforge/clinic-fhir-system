export interface PatientAddress {
  line: string;
  city: string;
  state: string;
  postalCode: string;
}

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

export interface ObservationPoint {
  id: string;
  loincCode: string;
  vitalType: 'systolic' | 'diastolic' | 'weight' | 'spo2';
  label: string;
  value: number;
  unit: string;
  date: string;
}

export interface EncounterItem {
  id: string;
  date: string;
  reason: string;
  status: string;
}

export type SelectedDetail =
  | { kind: 'observation'; data: ObservationPoint }
  | { kind: 'encounter'; data: EncounterItem };

export interface PatientSummary {
  id: string;
  name: string;
  dob: string;
  gender: string;
  mrn?: string;
  phone?: string;
  email?: string;
  address?: PatientAddress;
  maritalStatus?: string;
  language?: string;
  status: 'active' | 'inactive';
  encounters: EncounterItem[];
  vitals: VitalsSnapshot;
  allObservations: ObservationPoint[];
}
