# Key Flows

---

## Flow 1: Register Patient

```
POST /api/patients  { firstName, lastName, dateOfBirth, gender, phone }
  │
  ├─ PatientController.registerPatient(@Valid dto)
  │
  ├─ PatientService.register(dto)
  │     ├─ PatientMapper.toFhir(dto)            → builds FHIR Patient resource
  │     ├─ fhirClient.create()
  │     │       .resource(fhirPatient)
  │     │       .execute()                      → POST to HAPI FHIR
  │     │       returns MethodOutcome (has new ID)
  │     └─ PatientMapper.fromFhir(savedPatient) → builds PatientResponse DTO
  │
  └─ 201 Created  { id: "123", firstName: "John", ... }
```

---

## Flow 2: Record a Visit (Encounter)

```
POST /api/encounters  { patientId: "123", visitDate, reason }
  │
  ├─ EncounterController → EncounterService.create(dto)
  │     ├─ EncounterMapper.toFhir(dto)
  │     │     sets subject = Reference("Patient/123")
  │     ├─ fhirClient.create().resource(encounter).execute()
  │     └─ EncounterMapper.fromFhir(saved)
  │
  └─ 201 Created  { id: "456", patientId: "123", visitDate, reason }
```

---

## Flow 3: Add Vitals

```
POST /api/vitals  { patientId: "123", encounterId: "456",
                    weightKg: 72.5, spo2Percent: 98.0 }
  │
  ├─ VitalsController → VitalsService.save(dto)
  │     │
  │     ├─ for weightKg (not null):
  │     │     ObservationMapper.toFhir("123","456","29463-7", 72.5, "kg")
  │     │     fhirClient.create().resource(obs).execute()  → id: "789"
  │     │
  │     ├─ for spo2Percent (not null):
  │     │     ObservationMapper.toFhir("123","456","59408-5", 98.0, "%")
  │     │     fhirClient.create().resource(obs).execute()  → id: "790"
  │     │
  │     └─ returns List<VitalsResponse>
  │
  └─ 201 Created  [{ id:"789", type:"weight", value:72.5 }, ...]
```

---

## Flow 4: Fetch Patient Summary (Aggregation)

```
GET /api/patients/123/summary
  │
  ├─ SummaryController → SummaryService.getSummary("123")
  │     │
  │     ├─ fhirClient.read()
  │     │       .resource(Patient.class).withId("123").execute()
  │     │
  │     ├─ fhirClient.search()
  │     │       .forResource(Encounter.class)
  │     │       .where(Encounter.PATIENT.hasId("123"))
  │     │       .returnBundle(Bundle.class).execute()
  │     │
  │     ├─ fhirClient.search()
  │     │       .forResource(Observation.class)
  │     │       .where(Observation.PATIENT.hasId("123"))
  │     │       .returnBundle(Bundle.class).execute()
  │     │
  │     └─ map all 3 results → PatientSummaryResponse
  │
  └─ 200 OK  { patient: {...}, encounters: [...], vitals: [...] }
```

**Note:** These 3 FHIR calls are sequential in MVP. In production, they can be parallelised with `CompletableFuture` or replaced with a single FHIR `$everything` operation.

---

## Flow 5: Error — Patient Not Found

```
GET /api/patients/999
  │
  ├─ PatientService.getById("999")
  │     fhirClient.read().resource(Patient.class).withId("999").execute()
  │     HAPI throws ResourceNotFoundException (HTTP 404)
  │
  ├─ GlobalExceptionHandler.handleFhirError(ex)
  │
  └─ 404 Not Found  { "status": 404, "message": "Patient/999 not found" }
```
