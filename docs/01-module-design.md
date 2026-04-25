# Module Design

## Package Structure

```
com.clinic
├── config/
│   └── FhirConfig.java              ← IGenericClient bean, FhirContext bean
├── controller/
│   ├── PatientController.java
│   ├── EncounterController.java
│   ├── VitalsController.java
│   └── SummaryController.java
├── service/
│   ├── PatientService.java
│   ├── EncounterService.java
│   ├── VitalsService.java
│   └── SummaryService.java
├── mapper/
│   ├── PatientMapper.java
│   ├── EncounterMapper.java
│   └── ObservationMapper.java
├── dto/
│   ├── PatientRequest.java
│   ├── PatientResponse.java
│   ├── EncounterRequest.java
│   ├── EncounterResponse.java
│   ├── VitalsRequest.java
│   ├── VitalsResponse.java
│   ├── PatientSummaryResponse.java
│   └── ErrorResponse.java
└── exception/
    ├── ResourceNotFoundException.java
    └── GlobalExceptionHandler.java
```

## Layer Responsibilities

| Layer | Class | Responsibility |
|---|---|---|
| Controller | `PatientController` | HTTP routing, `@Valid` input validation, `ResponseEntity` shaping |
| Service | `PatientService` | Business logic, orchestrates mapper + FHIR client calls |
| Mapper | `PatientMapper` | Pure DTO ↔ FHIR resource conversion, no side effects |
| Config | `FhirConfig` | Provides singleton `IGenericClient` and `FhirContext` beans |
| DTO | `PatientRequest` | API contract — no FHIR types, uses Java `record` |
| Exception | `GlobalExceptionHandler` | Translates exceptions to structured `ErrorResponse` JSON |

## Core Rule

> **FHIR types (`org.hl7.fhir.r4.model.*`) must never appear in controllers or DTOs.**
> They are internal to `mapper/` and `service/` only.

## FhirConfig

```java
@Configuration
public class FhirConfig {

    @Bean
    public FhirContext fhirContext() {
        return FhirContext.forR4();
    }

    @Bean
    public IGenericClient fhirClient(FhirContext ctx,
                                      @Value("${fhir.server.url}") String url) {
        return ctx.newRestfulGenericClient(url);
    }
}
```

`IGenericClient` is thread-safe — one shared bean, used across all services.
