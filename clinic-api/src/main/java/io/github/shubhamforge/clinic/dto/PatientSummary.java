package io.github.shubhamforge.clinic.dto;

public record PatientSummary(
    String id,
    String firstName,
    String lastName,
    String dob,
    String gender,
    String mrn,
    String phone,
    String email) {}
