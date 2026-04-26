# FHIR Mapping Strategy

All FHIR resources use **R4** (Release 4).

---

## Patient → FHIR Patient

| Request Field | FHIR Path |
|---|---|
| `firstName` + `lastName` | `Patient.name[0]` (`HumanName`: `family`, `given`) |
| `dateOfBirth` | `Patient.birthDate` |
| `gender` | `Patient.gender` (`AdministrativeGender` enum) |
| `phone` | `Patient.telecom[system=phone]` |
| `email` | `Patient.telecom[system=email]` |

```java
public Patient toFhir(PatientRequest request) {
    Patient patient = new Patient();
    patient.addName().setFamily(request.lastName()).addGiven(request.firstName());
    patient.setBirthDateElement(new DateType(request.dateOfBirth().toString()));
    patient.setGender(Enumerations.AdministrativeGender.fromCode(request.gender().toLowerCase()));
    if (request.phone() != null)
        patient.addTelecom().setSystem(ContactPoint.ContactPointSystem.PHONE).setValue(request.phone());
    if (request.email() != null)
        patient.addTelecom().setSystem(ContactPoint.ContactPointSystem.EMAIL).setValue(request.email());
    return patient;
}
```

---

## Visit → FHIR Encounter

| Request Field | FHIR Path |
|---|---|
| `patientId` | `Encounter.subject` (Reference `Patient/{id}`) |
| `visitDate` | `Encounter.period.start` |
| `reason` | `Encounter.reasonCode[0].text` |
| `status` | `Encounter.status` (e.g., `"finished"`) |

---

## Vitals → FHIR Observation

Each vital becomes a **separate Observation** resource. Blood pressure = 2 observations.

### LOINC Codes

| Vital | LOINC Code | Unit |
|---|---|---|
| Blood Pressure (systolic) | `8480-6` | `mm[Hg]` |
| Blood Pressure (diastolic) | `8462-4` | `mm[Hg]` |
| Weight | `29463-7` | `kg` |
| SpO2 | `59408-5` | `%` |

LOINC system URI: `http://loinc.org`

### Field Mapping

| Request Field | FHIR Path |
|---|---|
| `patientId` | `Observation.subject` (Reference `Patient/{id}`) |
| `encounterId` | `Observation.encounter` (Reference `Encounter/{id}`) |
| `effectiveDate` | `Observation.effectiveDateTime` |
| `systolicBp` / `weightKg` / etc. | `Observation.valueQuantity.value` |
| unit (derived from LOINC code) | `Observation.valueQuantity.unit` + `system=http://unitsofmeasure.org` |
| LOINC code (derived from field name) | `Observation.code.coding[0]` |
| (always) | `Observation.status = "final"` |

```java
// ObservationMapper produces one Observation per non-null vital in the request
public List<Observation> toFhirObservations(VitalsRequest request) {
    List<Observation> observations = new ArrayList<>();
    if (request.systolicBp() != null)
        observations.add(build(request, "systolic", request.systolicBp().doubleValue(), effectiveDate));
    if (request.weightKg() != null)
        observations.add(build(request, "weight", request.weightKg(), effectiveDate));
    // ... diastolicBp, spo2Percent
    return observations;
}
```

---

## Why Separate Observations Per Vital?

This is the FHIR standard. Each `Observation` represents one measurable concept with one LOINC code. Storing multiple vitals in one resource violates FHIR semantics and breaks standard FHIR queries like:

```
GET /fhir/Observation?patient=123&code=29463-7   ← weight only
GET /fhir/Observation?patient=123&code=8480-6    ← systolic only
```
