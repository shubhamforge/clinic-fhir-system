package io.github.shubhamforge.clinic.dto;

import java.util.Map;

public record TimelineEvent(
    String id,
    String type,
    String date,
    String title,
    String subtitle,
    String status,
    String resourceId,
    Map<String, Object> metadata) {}
