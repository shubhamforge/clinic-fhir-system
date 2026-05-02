package io.github.shubhamforge.clinic.service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import ca.uhn.fhir.rest.gclient.DateClientParam;
import ca.uhn.fhir.rest.gclient.ReferenceClientParam;
import io.github.shubhamforge.clinic.dto.TimelineEvent;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.Appointment;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.DiagnosticReport;
import org.hl7.fhir.r4.model.Encounter;
import org.hl7.fhir.r4.model.Practitioner;
import org.hl7.fhir.r4.model.ServiceRequest;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class TimelineService {

  private static final int DEFAULT_LIMIT = 20;
  private static final int MAX_LIMIT = 50;

  private final IGenericClient fhirClient;
  private final PractitionerService practitionerService;

  public TimelineService(IGenericClient fhirClient, PractitionerService practitionerService) {
    this.fhirClient = fhirClient;
    this.practitionerService = practitionerService;
  }

  public List<TimelineEvent> getTimeline(
      String patientId, Integer limit, String before, String typesParam) {
    int resolvedLimit = (limit != null && limit > 0) ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
    Set<String> allowedTypes =
        typesParam != null
            ? Arrays.stream(typesParam.split(",")).map(String::trim).collect(Collectors.toSet())
            : Set.of("encounter", "observation", "report", "service-request", "appointment");

    List<TimelineEvent> events = new ArrayList<>();

    if (allowedTypes.contains("encounter")) {
      events.addAll(fetchEncounterEvents(patientId, before, resolvedLimit));
    }
    if (allowedTypes.contains("report")) {
      events.addAll(fetchReportEvents(patientId, before, resolvedLimit));
    }
    if (allowedTypes.contains("service-request")) {
      events.addAll(fetchServiceRequestEvents(patientId, before, resolvedLimit));
    }
    if (allowedTypes.contains("appointment")) {
      events.addAll(fetchAppointmentEvents(patientId, resolvedLimit));
    }

    // Resolve practitioner names (batch, deduplicated)
    Map<String, String> practitionerNames = resolvePractitionerNames(events);

    // Substitute practitioner IDs in metadata with resolved names
    events =
        events.stream()
            .map(e -> resolvePractitionerInEvent(e, practitionerNames))
            .collect(Collectors.toList());

    // Sort: future dates first (appointments), then past events descending
    events.sort(
        Comparator.comparing(
            (TimelineEvent e) -> LocalDate.parse(e.date()), Comparator.reverseOrder()));

    // Apply before cursor
    if (before != null) {
      LocalDate cursor = LocalDate.parse(before);
      events =
          events.stream()
              .filter(e -> LocalDate.parse(e.date()).isBefore(cursor))
              .collect(Collectors.toList());
    }

    return events.stream().limit(resolvedLimit).collect(Collectors.toList());
  }

  private List<TimelineEvent> fetchEncounterEvents(String patientId, String before, int limit) {
    var query =
        fhirClient
            .search()
            .forResource(Encounter.class)
            .where(new ReferenceClientParam("subject").hasId("Patient/" + patientId))
            .sort()
            .descending("date")
            .count(limit)
            .returnBundle(Bundle.class);
    if (before != null) {
      query = query.and(new DateClientParam("date").before().day(before));
    }
    Bundle bundle = query.execute();
    List<TimelineEvent> events = new ArrayList<>();
    if (bundle.getEntry() == null) return events;
    for (var entry : bundle.getEntry()) {
      Encounter enc = (Encounter) entry.getResource();
      String date = extractEncounterDate(enc);
      if (date == null) continue;
      String practitionerId = extractAttendingPractitionerId(enc);
      Map<String, Object> metadata = new LinkedHashMap<>();
      if (practitionerId != null) metadata.put("_practitionerId", practitionerId);
      String reason =
          enc.hasReasonCode() && !enc.getReasonCode().isEmpty()
              ? enc.getReasonCodeFirstRep().getText()
              : null;
      events.add(
          new TimelineEvent(
              enc.getIdElement().getIdPart(),
              "encounter",
              date,
              "Clinic Visit",
              reason,
              enc.getStatus() != null ? enc.getStatus().toCode() : null,
              "Encounter/" + enc.getIdElement().getIdPart(),
              metadata));
    }
    return events;
  }

  private List<TimelineEvent> fetchReportEvents(String patientId, String before, int limit) {
    var query =
        fhirClient
            .search()
            .forResource(DiagnosticReport.class)
            .where(new ReferenceClientParam("subject").hasId("Patient/" + patientId))
            .sort()
            .descending("issued")
            .count(limit)
            .returnBundle(Bundle.class);
    if (before != null) {
      query = query.and(new DateClientParam("issued").before().day(before));
    }
    Bundle bundle = query.execute();
    List<TimelineEvent> events = new ArrayList<>();
    if (bundle.getEntry() == null) return events;
    for (var entry : bundle.getEntry()) {
      DiagnosticReport rpt = (DiagnosticReport) entry.getResource();
      String date =
          rpt.hasIssued()
              ? rpt.getIssued().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString()
              : null;
      if (date == null) continue;
      Map<String, Object> metadata = new LinkedHashMap<>();
      if (rpt.hasConclusion()) metadata.put("conclusion", rpt.getConclusion());
      if (rpt.hasBasedOn() && !rpt.getBasedOn().isEmpty()) {
        String srRef = rpt.getBasedOnFirstRep().getReference();
        if (srRef != null) metadata.put("serviceRequestId", srRef.replace("ServiceRequest/", ""));
      }
      String title = rpt.hasCode() ? rpt.getCode().getText() : "Diagnostic Report";
      events.add(
          new TimelineEvent(
              rpt.getIdElement().getIdPart(),
              "report",
              date,
              "Lab Results Available",
              title,
              rpt.getStatus() != null ? rpt.getStatus().toCode() : null,
              "DiagnosticReport/" + rpt.getIdElement().getIdPart(),
              metadata));
    }
    return events;
  }

  private List<TimelineEvent> fetchServiceRequestEvents(
      String patientId, String before, int limit) {
    var query =
        fhirClient
            .search()
            .forResource(ServiceRequest.class)
            .where(new ReferenceClientParam("subject").hasId("Patient/" + patientId))
            .sort()
            .descending("authored")
            .count(limit)
            .returnBundle(Bundle.class);
    if (before != null) {
      query = query.and(new DateClientParam("authored").before().day(before));
    }
    Bundle bundle = query.execute();
    List<TimelineEvent> events = new ArrayList<>();
    if (bundle.getEntry() == null) return events;
    for (var entry : bundle.getEntry()) {
      ServiceRequest sr = (ServiceRequest) entry.getResource();
      String date =
          sr.hasAuthoredOn()
              ? sr.getAuthoredOn()
                  .toInstant()
                  .atZone(ZoneId.systemDefault())
                  .toLocalDate()
                  .toString()
              : null;
      if (date == null) continue;
      Map<String, Object> metadata = new LinkedHashMap<>();
      if (!sr.getCategory().isEmpty()) metadata.put("category", sr.getCategoryFirstRep().getText());
      if (sr.hasPriority()) metadata.put("priority", sr.getPriority().toCode());
      if (sr.hasRequester()) {
        String reqRef = sr.getRequester().getReference();
        if (reqRef != null) metadata.put("_practitionerId", reqRef.replace("Practitioner/", ""));
      }
      String code = sr.hasCode() ? sr.getCode().getText() : "Lab/Imaging Order";
      events.add(
          new TimelineEvent(
              sr.getIdElement().getIdPart(),
              "service-request",
              date,
              "Lab Test Ordered",
              code,
              sr.getStatus() != null ? sr.getStatus().toCode() : null,
              "ServiceRequest/" + sr.getIdElement().getIdPart(),
              metadata));
    }
    return events;
  }

  private List<TimelineEvent> fetchAppointmentEvents(String patientId, int limit) {
    Bundle bundle =
        fhirClient
            .search()
            .forResource(Appointment.class)
            .where(new ReferenceClientParam("actor").hasId("Patient/" + patientId))
            .and(new DateClientParam("date").afterOrEquals().day(LocalDate.now().toString()))
            .sort()
            .ascending("date")
            .count(limit)
            .returnBundle(Bundle.class)
            .execute();
    List<TimelineEvent> events = new ArrayList<>();
    if (bundle.getEntry() == null) return events;
    for (var entry : bundle.getEntry()) {
      Appointment appt = (Appointment) entry.getResource();
      String date =
          appt.hasStart()
              ? appt.getStart().toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString()
              : null;
      if (date == null) continue;
      Map<String, Object> metadata = new LinkedHashMap<>();
      String practitionerId =
          appt.getParticipant().stream()
              .map(p -> p.getActor().getReference())
              .filter(ref -> ref != null && ref.startsWith("Practitioner/"))
              .map(ref -> ref.replace("Practitioner/", ""))
              .findFirst()
              .orElse(null);
      if (practitionerId != null) metadata.put("_practitionerId", practitionerId);
      events.add(
          new TimelineEvent(
              appt.getIdElement().getIdPart(),
              "appointment",
              date,
              "Upcoming Appointment",
              appt.hasDescription() ? appt.getDescription() : null,
              appt.getStatus() != null ? appt.getStatus().toCode() : null,
              "Appointment/" + appt.getIdElement().getIdPart(),
              metadata));
    }
    return events;
  }

  private Map<String, String> resolvePractitionerNames(List<TimelineEvent> events) {
    Set<String> ids =
        events.stream()
            .filter(e -> e.metadata() != null && e.metadata().containsKey("_practitionerId"))
            .map(e -> (String) e.metadata().get("_practitionerId"))
            .collect(Collectors.toSet());
    Map<String, String> names = new HashMap<>();
    for (String id : ids) {
      try {
        Practitioner p = practitionerService.getPractitioner(id);
        String name =
            p.hasName()
                ? "Dr. "
                    + p.getNameFirstRep().getGivenAsSingleString()
                    + " "
                    + p.getNameFirstRep().getFamily()
                : id;
        names.put(id, name);
      } catch (Exception e) {
        log.warn("Could not resolve practitioner {}", id);
      }
    }
    return names;
  }

  private TimelineEvent resolvePractitionerInEvent(TimelineEvent event, Map<String, String> names) {
    if (event.metadata() == null || !event.metadata().containsKey("_practitionerId")) return event;
    Map<String, Object> meta = new LinkedHashMap<>(event.metadata());
    String id = (String) meta.remove("_practitionerId");
    String name = names.getOrDefault(id, id);
    if ("encounter".equals(event.type())) meta.put("provider", name);
    else if ("service-request".equals(event.type())) meta.put("orderedBy", name);
    else if ("appointment".equals(event.type())) meta.put("provider", name);
    return new TimelineEvent(
        event.id(),
        event.type(),
        event.date(),
        event.title(),
        event.subtitle(),
        event.status(),
        event.resourceId(),
        meta);
  }

  private String extractEncounterDate(Encounter enc) {
    if (enc.hasPeriod() && enc.getPeriod().hasStart()) {
      Date start = enc.getPeriod().getStart();
      return start.toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString();
    }
    return null;
  }

  private String extractAttendingPractitionerId(Encounter enc) {
    if (!enc.hasParticipant()) return null;
    return enc.getParticipant().stream()
        .filter(
            p ->
                p.hasType()
                    && p.getType().stream()
                        .anyMatch(
                            t ->
                                t.hasCoding()
                                    && t.getCoding().stream()
                                        .anyMatch(c -> "ATND".equals(c.getCode()))))
        .map(p -> p.getIndividual().getReference())
        .filter(ref -> ref != null && ref.startsWith("Practitioner/"))
        .map(ref -> ref.replace("Practitioner/", ""))
        .findFirst()
        .orElse(null);
  }
}
