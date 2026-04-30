import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  FhirBundle,
  FhirPatient,
  FhirEncounter,
  FhirObservation,
  isFhirPatient,
  isFhirEncounter,
  isFhirObservation,
} from '../models/fhir-bundle.model';
import { PatientListItem } from '../models/patient-list-item.model';
import {
  PatientSummary,
  EncounterItem,
  VitalsSnapshot,
  VitalReading,
} from '../models/patient-detail.model';

const LOINC_SYSTOLIC = '8480-6';
const LOINC_DIASTOLIC = '8462-4';
const LOINC_WEIGHT = '29463-7';
const LOINC_SPO2 = '59408-5';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  // GET /api/patients → FHIR Bundle (proxied to http://localhost:9090 in dev)
  getPatients(): Observable<PatientListItem[]> {
    return this.http
      .get<FhirBundle>('/api/patients')
      .pipe(map((bundle) => this.mapBundle(bundle)));
  }

  getPatientSummary(id: string): Observable<PatientSummary> {
    return this.http
      .get<FhirBundle>(`/api/patients/${id}/summary`)
      .pipe(map((bundle) => this.mapSummaryBundle(bundle)));
  }

  private mapBundle(bundle: FhirBundle): PatientListItem[] {
    return (bundle.entry ?? [])
      .map((e) => e.resource)
      .filter(isFhirPatient)
      .map((p) => this.mapPatient(p));
  }

  private mapPatient(p: FhirPatient): PatientListItem {
    const nameObj = p.name?.[0];
    const given = nameObj?.given?.join(' ') ?? '';
    const family = nameObj?.family ?? '';
    // Prefer the "text" field if the server provides it, otherwise build from parts
    const fullName = nameObj?.text ?? ([given, family].filter(Boolean).join(' ') || 'Unknown');

    return {
      id: p.id ?? '',
      name: fullName,
      gender: p.gender ?? 'unknown',
      dob: p.birthDate ?? '',
      status: p.active === false ? 'inactive' : 'active',
      // lastEncounter requires a separate encounter query — deferred to patient detail screen
      lastEncounter: undefined,
    };
  }

  private mapSummaryBundle(bundle: FhirBundle): PatientSummary {
    const resources = (bundle.entry ?? []).map((e) => e.resource);

    const fhirPatient = resources.find(isFhirPatient);
    const encounters = resources.filter(isFhirEncounter);
    const observations = resources.filter(isFhirObservation);

    const nameObj = fhirPatient?.name?.[0];
    const given = nameObj?.given?.join(' ') ?? '';
    const family = nameObj?.family ?? '';
    const fullName = nameObj?.text ?? ([given, family].filter(Boolean).join(' ') || 'Unknown');

    const phone = fhirPatient?.telecom?.find((t) => t.system === 'phone')?.value;
    const email = fhirPatient?.telecom?.find((t) => t.system === 'email')?.value;

    return {
      id: fhirPatient?.id ?? '',
      name: fullName,
      dob: fhirPatient?.birthDate ?? '',
      gender: fhirPatient?.gender ?? 'unknown',
      phone,
      email,
      status: fhirPatient?.active === false ? 'inactive' : 'active',
      encounters: this.mapEncounters(encounters),
      vitals: this.mapVitals(observations),
    };
  }

  private mapEncounters(encounters: FhirEncounter[]): EncounterItem[] {
    return encounters
      .map((e) => ({
        id: e.id ?? '',
        date: e.period?.start ?? '',
        reason: e.reasonCode?.[0]?.text ?? '—',
        status: e.status ?? 'unknown',
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }

  private mapVitals(observations: FhirObservation[]): VitalsSnapshot {
    const pick = (loincCode: string): VitalReading | undefined => {
      const matches = observations.filter(
        (o) => o.code?.coding?.some((c) => c.code === loincCode),
      );
      if (!matches.length) return undefined;

      const latest = matches.sort((a, b) =>
        (b.effectiveDateTime ?? '').localeCompare(a.effectiveDateTime ?? ''),
      )[0];

      const value = latest.valueQuantity?.value;
      if (value === undefined) return undefined;

      return {
        value,
        unit: latest.valueQuantity?.unit ?? '',
        date: latest.effectiveDateTime ?? '',
      };
    };

    return {
      systolic: pick(LOINC_SYSTOLIC),
      diastolic: pick(LOINC_DIASTOLIC),
      weight: pick(LOINC_WEIGHT),
      spo2: pick(LOINC_SPO2),
    };
  }
}
