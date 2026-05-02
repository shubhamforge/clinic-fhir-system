package io.github.shubhamforge.clinic.dto;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
    Map<String, Object> patient,
    Map<String, Object> careTeam,
    SnapshotResponse snapshot,
    Map<String, Object> upcomingAppointment,
    List<Map<String, Object>> recentEncounters,
    List<Map<String, Object>> pendingServiceRequests,
    Map<String, Object> activeCarePlan,
    Map<String, Object> recentDiagnosticReport,
    List<String> warnings) {}
