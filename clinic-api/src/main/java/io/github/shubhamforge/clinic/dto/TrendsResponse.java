package io.github.shubhamforge.clinic.dto;

import java.util.Map;

public record TrendsResponse(String period, String from, String to, Map<String, Object> series) {}
