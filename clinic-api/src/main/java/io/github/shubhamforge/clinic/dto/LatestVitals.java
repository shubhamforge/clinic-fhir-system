package io.github.shubhamforge.clinic.dto;

public record LatestVitals(
    VitalReading systolicBp,
    VitalReading diastolicBp,
    VitalReading weightKg,
    VitalReading spo2Percent) {}
