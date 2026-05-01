const SPRING_API = 'http://localhost:9090';
const HAPI_FHIR = 'http://localhost:8080';

export interface FhirPatientResponse {
  resourceType: 'Patient';
  id: string;
}

export interface FhirEncounterResponse {
  resourceType: 'Encounter';
  id: string;
}

export interface FhirBundleResponse {
  resourceType: 'Bundle';
}

export interface CreatePatientBody {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
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

  createPatient(body: CreatePatientBody): Promise<FhirPatientResponse> {
    return this.post<FhirPatientResponse>(`${SPRING_API}/api/patients`, body);
  }

  createEncounter(body: CreateEncounterBody): Promise<FhirEncounterResponse> {
    return this.post<FhirEncounterResponse>(`${SPRING_API}/api/encounters`, body);
  }

  recordVitals(body: CreateVitalsBody): Promise<FhirBundleResponse> {
    return this.post<FhirBundleResponse>(`${SPRING_API}/api/vitals`, body);
  }

  createPractitioner(resource: object): Promise<{ resourceType: 'Practitioner'; id: string }> {
    return this.post<{ resourceType: 'Practitioner'; id: string }>(
      `${HAPI_FHIR}/fhir/Practitioner`,
      resource,
      'application/fhir+json',
    );
  }

  createOrganization(resource: object): Promise<{ resourceType: 'Organization'; id: string }> {
    return this.post<{ resourceType: 'Organization'; id: string }>(
      `${HAPI_FHIR}/fhir/Organization`,
      resource,
      'application/fhir+json',
    );
  }
}

export const apiClient = new ApiClient();
