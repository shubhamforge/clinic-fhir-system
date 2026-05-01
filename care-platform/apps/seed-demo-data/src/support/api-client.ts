const SPRING_API = 'http://localhost:9090';
const HAPI_FHIR = 'http://localhost:8080';

export interface FhirEncounterResponse {
  resourceType: 'Encounter';
  id: string;
}

export interface FhirBundleResponse {
  resourceType: 'Bundle';
}

export interface CreateEncounterBody {
  patientId: string;
  visitDate: string;
  reason?: string;
  status: string;
}

export interface CreateVitalsBody {
  patientId: string;
  encounterId?: string;
  effectiveDate: string;
  systolicBp?: number;
  diastolicBp?: number;
  weightKg?: number;
  spo2Percent?: number;
}

export interface PatientFields {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
}

interface FhirSearchBundle {
  entry?: Array<{ resource: { id: string } }>;
}

class ApiClient {
  private async post<T>(url: string, body: unknown, contentType = 'application/json'): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`POST ${url} failed [${response.status}]: ${text.slice(0, 300)}`);
    }
    return response.json() as Promise<T>;
  }

  private async put(url: string, body: object): Promise<void> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/fhir+json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`PUT ${url} failed [${response.status}]: ${text.slice(0, 300)}`);
    }
  }

  private async searchFhirIds(resourceType: string, query?: string): Promise<string[]> {
    const qs = query ? `&${query}` : '';
    const response = await fetch(`${HAPI_FHIR}/fhir/${resourceType}?_count=1000&_elements=id${qs}`, {
      headers: { Accept: 'application/fhir+json' },
    });
    if (!response.ok) throw new Error(`GET /fhir/${resourceType} failed [${response.status}]`);
    const bundle = (await response.json()) as FhirSearchBundle;
    return bundle.entry?.map((e) => e.resource.id).filter(Boolean) ?? [];
  }

  private async deleteFhirById(resourceType: string, id: string): Promise<void> {
    const response = await fetch(`${HAPI_FHIR}/fhir/${resourceType}/${id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) {
      throw new Error(`DELETE /fhir/${resourceType}/${id} failed [${response.status}]`);
    }
  }

  async cascadeDeletePatient(id: string): Promise<void> {
    const obsIds = await this.searchFhirIds('Observation', `patient=${id}`);
    await Promise.all(obsIds.map((oid) => this.deleteFhirById('Observation', oid)));

    const encIds = await this.searchFhirIds('Encounter', `patient=${id}`);
    await Promise.all(encIds.map((eid) => this.deleteFhirById('Encounter', eid)));

    await this.deleteFhirById('Patient', id);
  }

  async upsertPatient(fields: PatientFields): Promise<void> {
    const telecom = [];
    if (fields.phone) telecom.push({ system: 'phone', value: fields.phone });
    if (fields.email) telecom.push({ system: 'email', value: fields.email });

    await this.put(`${HAPI_FHIR}/fhir/Patient/${fields.id}`, {
      resourceType: 'Patient',
      id: fields.id,
      active: true,
      name: [{ family: fields.lastName, given: [fields.firstName] }],
      birthDate: fields.dateOfBirth,
      gender: fields.gender,
      ...(telecom.length > 0 && { telecom }),
    });
  }

  async upsertPractitioner(id: string): Promise<void> {
    await this.deleteFhirById('Practitioner', id);
    await this.put(`${HAPI_FHIR}/fhir/Practitioner/${id}`, {
      resourceType: 'Practitioner',
      id,
      active: true,
      name: [{ family: 'Seed', given: ['Default'], prefix: ['Dr.'] }],
      gender: 'unknown',
    });
  }

  async upsertOrganization(id: string): Promise<void> {
    await this.deleteFhirById('Organization', id);
    await this.put(`${HAPI_FHIR}/fhir/Organization/${id}`, {
      resourceType: 'Organization',
      id,
      active: true,
      name: 'Seed Dev Clinic',
      type: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/organization-type',
              code: 'prov',
              display: 'Healthcare Provider',
            },
          ],
        },
      ],
    });
  }

  createEncounter(body: CreateEncounterBody): Promise<FhirEncounterResponse> {
    return this.post<FhirEncounterResponse>(`${SPRING_API}/api/encounters`, body);
  }

  recordVitals(body: CreateVitalsBody): Promise<FhirBundleResponse> {
    return this.post<FhirBundleResponse>(`${SPRING_API}/api/vitals`, body);
  }
}

export const apiClient = new ApiClient();
