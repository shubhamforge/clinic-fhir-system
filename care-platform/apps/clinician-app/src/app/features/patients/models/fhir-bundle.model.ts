// Minimal FHIR R4 types for the patient roster.
// Only the fields we actually use are typed — avoids over-modelling the spec.

export interface FhirBundle {
  resourceType: 'Bundle';
  type?: string;
  total?: number;
  entry?: FhirBundleEntry[];
}

export interface FhirBundleEntry {
  resource?: FhirResource;
}

export interface FhirResource {
  resourceType: string;
}

export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  id?: string;
  active?: boolean;
  name?: FhirHumanName[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string; // YYYY-MM-DD
}

export interface FhirHumanName {
  family?: string;
  given?: string[];
  text?: string; // full name when present
}

export function isFhirPatient(r: FhirResource | undefined): r is FhirPatient {
  return r?.resourceType === 'Patient';
}
