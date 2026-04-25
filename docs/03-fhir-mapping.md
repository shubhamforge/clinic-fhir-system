# FHIR Mapping Strategy

All FHIR resources use **R4** (Release 4).

---

## Patient → FHIR Patient

| Business Field | FHIR Path |
|---|---|
| `firstName` + `lastName` | `Patient.name[0]` (`HumanName`: `family`, `given`) |
| `dateOfBirth` | `Patient.birthDate` |
| `gender` | `Patient.gender` (`AdministrativeGender` enum) |
| `phone` | `Patient.telecom[system=phone]` |
| `email` | `Patient.telecom[system=email]` |

```java
public Patient toFhir(PatientRequest dto) {
    Patient patient = new Patient();
    patient.addName()
        .setFamily(dto.lastName())
        .addGiven(dto.firstName());
    patient.setBirthDateElement(new DateType(dto.dateOfBirth().toString()));
    patient.setGender(Enumerations.AdministrativeGender.fromCode(dto.gender()));
    patient.addTelecom()
        .setSystem(ContactPoint.ContactPointSystem.PHONE)
        .setValue(dto.phone());
    return patient;
}
```

---

## Visit → FHIR Encounter

| Business Field | FHIR Path |
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

| Business Field | FHIR Path |
|---|---|
| `patientId` | `Observation.subject` (Reference `Patient/{id}`) |
| `encounterId` | `Observation.encounter` (Reference `Encounter/{id}`) |
| `recordedAt` | `Observation.effectiveDateTime` |
| `value` | `Observation.valueQuantity.value` |
| unit | `Observation.valueQuantity.unit` + `system=http://unitsofmeasure.org` |
| LOINC code | `Observation.code.coding[0]` |
| (always) | `Observation.status = "final"` |

```java
public Observation toFhir(String patientId, String encounterId,
                            String loincCode, double value, String unit) {
    Observation obs = new Observation();
    obs.setStatus(Observation.ObservationStatus.FINAL);
    obs.setSubject(new Reference("Patient/" + patientId));
    if (encounterId != null) obs.setEncounter(new Reference("Encounter/" + encounterId));
    obs.getCode().addCoding()
        .setSystem("http://loinc.org")
        .setCode(loincCode);
    obs.setValue(new Quantity()
        .setValue(value)
        .setUnit(unit)
        .setSystem("http://unitsofmeasure.org"));
    return obs;
}
```

---

## Why Separate Observations Per Vital?

This is the FHIR standard. Each `Observation` represents one measurable concept with one LOINC code. Storing multiple vitals in one resource violates FHIR semantics and breaks standard FHIR queries like:

```
GET /fhir/Observation?patient=123&code=29463-7   ← weight only
GET /fhir/Observation?patient=123&code=8480-6    ← systolic only
```
