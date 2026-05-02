package io.github.shubhamforge.clinic.dto;

public record AlertItem(String severity, String type, String message, String resourceId) {}
