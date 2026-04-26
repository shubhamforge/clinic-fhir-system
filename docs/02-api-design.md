# API Design

Base URL: `http://localhost:9090`

All responses are native FHIR R4 resources with `Content-Type: application/fhir+json`.

---

## Patient APIs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/patients` | Register a new patient |
| `GET` | `/api/patients/{id}` | Get patient by FHIR ID |
| `GET` | `/api/patients?name=John&dob=1990-01-01` | Search patients |

### POST /api/patients

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "phone": "9876543210",
  "email": "john.doe@email.com"
}
```

**Response `201 Created` — `Patient` resource:**
```json
{
  "resourceType": "Patient",
  "id": "123",
  "name": [{ "family": "Doe", "given": ["John"] }],
  "birthDate": "1990-05-15",
  "gender": "male",
  "telecom": [
    { "system": "phone", "value": "9876543210" },
    { "system": "email", "value": "john.doe@email.com" }
  ]
}
```

### GET /api/patients?name=John

**Response `200 OK` — `Bundle` (searchset):**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "entry": [
    { "resource": { "resourceType": "Patient", "id": "123", "name": [{ "family": "Doe", "given": ["John"] }], ... } }
  ]
}
```

---

## Encounter APIs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/encounters` | Record a new visit |
| `GET` | `/api/encounters/{id}` | Get encounter by ID |
| `GET` | `/api/encounters?patientId={id}` | List encounters for a patient |

### POST /api/encounters

**Request:**
```json
{
  "patientId": "123",
  "visitDate": "2025-04-25",
  "reason": "Routine checkup",
  "status": "finished"
}
```

**Response `201 Created` — `Encounter` resource:**
```json
{
  "resourceType": "Encounter",
  "id": "456",
  "status": "finished",
  "subject": { "reference": "Patient/123" },
  "period": { "start": "2025-04-25T00:00:00+05:30" },
  "reasonCode": [{ "text": "Routine checkup" }]
}
```

### GET /api/encounters?patientId=123

**Response `200 OK` — `Bundle` (searchset):**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "entry": [
    { "resource": { "resourceType": "Encounter", "id": "456", ... } }
  ]
}
```

---

## Vitals APIs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/vitals` | Record one or more vitals |
| `GET` | `/api/vitals?patientId={id}` | Get all vitals for a patient |
| `GET` | `/api/vitals?patientId={id}&type=weight` | Filter by vital type (`systolic`, `diastolic`, `weight`, `spo2`) |

### POST /api/vitals

Send only the vitals you have — null fields are skipped. Each non-null vital becomes a separate `Observation`.

**Request:**
```json
{
  "patientId": "123",
  "encounterId": "456",
  "effectiveDate": "2025-04-25",
  "systolicBp": 120,
  "diastolicBp": 80,
  "weightKg": 72.5,
  "spo2Percent": 98.0
}
```

**Response `201 Created` — `Bundle` (collection) of created Observations:**
```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Observation",
        "id": "789",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "8480-6", "display": "Systolic blood pressure" }] },
        "subject": { "reference": "Patient/123" },
        "encounter": { "reference": "Encounter/456" },
        "valueQuantity": { "value": 120, "unit": "mm[Hg]", "system": "http://unitsofmeasure.org" }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "790",
        "status": "final",
        "code": { "coding": [{ "system": "http://loinc.org", "code": "29463-7", "display": "Body weight" }] },
        "valueQuantity": { "value": 72.5, "unit": "kg" }
      }
    }
  ]
}
```

---

## Summary API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/patients/{id}/summary` | Full patient summary (aggregation) |

**Response `200 OK` — `Bundle` (collection) of Patient + Encounters + Observations:**
```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    { "resource": { "resourceType": "Patient", "id": "123", ... } },
    { "resource": { "resourceType": "Encounter", "id": "456", ... } },
    { "resource": { "resourceType": "Observation", "id": "789", ... } }
  ]
}
```

---

## Error Response

Errors return plain JSON (not FHIR) with `Content-Type: application/json`:
```json
{
  "status": 404,
  "message": "Patient with id '999' not found"
}
```
