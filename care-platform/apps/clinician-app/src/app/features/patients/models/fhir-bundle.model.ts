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
  telecom?: Array<{ system?: string; value?: string }>;
  identifier?: Array<{
    type?: { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string };
    value?: string;
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  maritalStatus?: { coding?: Array<{ code?: string; display?: string }>; text?: string };
  communication?: Array<{
    language?: { coding?: Array<{ code?: string; display?: string }>; text?: string };
  }>;
}

export interface FhirHumanName {
  family?: string;
  given?: string[];
  text?: string; // full name when present
}

export function isFhirPatient(r: FhirResource | undefined): r is FhirPatient {
  return r?.resourceType === 'Patient';
}

export interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  id?: string;
  status?: string;
  subject?: { reference?: string };
  period?: { start?: string; end?: string };
  reasonCode?: Array<{ text?: string }>;
}

export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  id?: string;
  code?: { coding?: Array<{ system?: string; code?: string; display?: string }> };
  effectiveDateTime?: string;
  valueQuantity?: { value?: number; unit?: string; system?: string };
}

export function isFhirEncounter(r: FhirResource | undefined): r is FhirEncounter {
  return r?.resourceType === 'Encounter';
}

export function isFhirObservation(r: FhirResource | undefined): r is FhirObservation {
  return r?.resourceType === 'Observation';
}
