# Best Practices & Clean Architecture

---

## Do

| Practice | Detail |
|---|---|
| Return native FHIR resources | Controllers return `Patient`, `Encounter`, `Bundle` — no custom response wrappers |
| Use Java `record` for request DTOs | Immutable, concise, no boilerplate (Java 16+) |
| Single `IGenericClient` bean | Thread-safe, shared across all services |
| `ResponseEntity<T>` in controllers | Explicit HTTP status control |
| `@Valid` on all request bodies | Input validation at the boundary |
| Log FHIR calls at DEBUG | Use HAPI's `LoggingInterceptor` on the client |
| New `IParser` per request | HAPI parsers are NOT thread-safe — `FhirHttpMessageConverter` creates a fresh instance per write |

### Logging Interceptor

```java
@Bean
public IGenericClient fhirClient(FhirContext ctx, @Value("${fhir.server.url}") String url) {
    IGenericClient client = ctx.newRestfulGenericClient(url);
    LoggingInterceptor logging = new LoggingInterceptor();
    logging.setLogRequestSummary(true);
    logging.setLogResponseSummary(true);
    client.registerInterceptor(logging);
    return client;
}
```

---

## Don't

| Anti-pattern | Why |
|---|---|
| Query PostgreSQL directly from clinic-api | Bypasses FHIR semantics and versioning |
| Put business logic in controllers | Controllers handle HTTP, not rules |
| Create a Spring Boot datasource for HAPI's DB | HAPI owns the schema |
| Add Spring Security in Phase 1 | High setup cost, low MVP value |
| Wrap `IGenericClient` in a repository interface | It's already a well-defined abstraction |
| Add error handling for impossible cases | Trust HAPI's exceptions; catch only `BaseServerResponseException` |
| Share an `IParser` instance across threads | HAPI parsers are NOT thread-safe — always create per request |

---

## Error Handling

Catch these exception types in `GlobalExceptionHandler`:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Your own domain errors (e.g., patient not found before calling FHIR)
    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse(404, ex.getMessage()));
    }

    // HAPI FHIR errors (404, 422 validation, 500, etc.)
    @ExceptionHandler(BaseServerResponseException.class)
    ResponseEntity<ErrorResponse> handleFhirError(BaseServerResponseException ex) {
        return ResponseEntity.status(ex.getStatusCode())
            .body(new ErrorResponse(ex.getStatusCode(), ex.getMessage()));
    }

    // Bean Validation failures (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.status(400).body(new ErrorResponse(400, msg));
    }
}
```

---

## Separation of Concerns Summary

```
HTTP boundary       → Controller  (routing, validation, response codes)
Business logic      → Service     (orchestration, rules, returns FHIR resources)
Data translation    → Mapper      (Request DTO → FHIR resource, toFhir() only)
FHIR communication  → IGenericClient (via FhirConfig bean)
FHIR serialization  → FhirHttpMessageConverter (application/fhir+json)
Error translation   → GlobalExceptionHandler
```

No layer should reach into another layer's concern. A service should never build an `HttpServletResponse`. A mapper should never call a FHIR client.

---

## Interview Talking Points

- "Spring Boot acts as a business layer, not a FHIR proxy — it owns input validation and DTO→FHIR translation"
- "Responses are native FHIR R4 resources — clients get the full resource including metadata, versioning, and extensions"
- "A custom `HttpMessageConverter` bridges HAPI's parser with Spring MVC, so controllers just return FHIR types naturally"
- "Each vital is a separate Observation with a LOINC code — this is standard FHIR practice and makes them individually queryable"
- "HAPI uses an EAV-style schema with separate index tables, so search never parses JSON"
- "The system is a monolith now, but the `clinic-*` naming convention makes future microservice extraction straightforward"
