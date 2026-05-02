package io.github.shubhamforge.clinic.dto;

public record VitalReading(Double value, String unit, String date, Boolean flagged) {}
