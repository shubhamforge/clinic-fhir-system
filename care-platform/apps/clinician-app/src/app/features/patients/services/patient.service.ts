import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FhirBundle, FhirPatient, isFhirPatient } from '../models/fhir-bundle.model';
import { PatientListItem } from '../models/patient-list-item.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);

  // GET /api/patients → FHIR Bundle (proxied to http://localhost:9090 in dev)
  getPatients(): Observable<PatientListItem[]> {
    return this.http
      .get<FhirBundle>('/api/patients')
      .pipe(map((bundle) => this.mapBundle(bundle)));
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
}
