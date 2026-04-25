# API Design

Base URL: `http://localhost:9090`

---

## Patient APIs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/patients` | Register a new patient |
| `GET` | `/api/patients/{id}` | Get patient by FHIR ID |
| `GET` | `/api/patients?name=John&dob=1990-01-01` | Search patients |
| `PUT` | `/api/patients/{id}` | Update patient demographics |

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

**Response `201`:**
```json
{
  "id": "123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "phone": "9876543210",
  "email": "john.doe@email.com"
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
  "visitDate": "2025-04-25T10:30:00",
  "reason": "Routine checkup",
  "status": "finished"
}
```

**Response `201`:**
```json
{
  "id": "456",
  "patientId": "123",
  "visitDate": "2025-04-25T10:30:00",
  "reason": "Routine checkup",
  "status": "finished"
}
```

---

## Vitals APIs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/vitals` | Record one or more vitals |
| `GET` | `/api/vitals?patientId={id}` | Get all vitals for a patient |
| `GET` | `/api/vitals?patientId={id}&type=weight` | Filter by vital type |

### POST /api/vitals

Send only the vitals you have — null fields are skipped.

**Request:**
```json
{
  "patientId": "123",
  "encounterId": "456",
  "recordedAt": "2025-04-25T10:35:00",
  "bloodPressureSystolic": 120.0,
  "bloodPressureDiastolic": 80.0,
  "weightKg": 72.5,
  "spo2Percent": 98.0
}
```

**Response `201`:**
```json
[
  { "id": "789", "type": "blood-pressure-systolic", "value": 120.0, "unit": "mm[Hg]" },
  { "id": "790", "type": "blood-pressure-diastolic", "value": 80.0, "unit": "mm[Hg]" },
  { "id": "791", "type": "weight", "value": 72.5, "unit": "kg" },
  { "id": "792", "type": "spo2", "value": 98.0, "unit": "%" }
]
```

---

## Summary API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/patients/{id}/summary` | Full patient summary (aggregation) |

**Response `200`:**
```json
{
  "patient": { "id": "123", "firstName": "John", ... },
  "encounters": [ { "id": "456", "visitDate": "...", "reason": "..." } ],
  "vitals": [ { "id": "789", "type": "weight", "value": 72.5, "unit": "kg" } ]
}
```

---

## Error Response

All errors return a consistent shape:
```json
{
  "status": 404,
  "message": "Patient with id 999 not found"
}
```
