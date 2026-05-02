package io.github.shubhamforge.clinic.dto;

public record GoalProgress(
    Double currentValue,
    Double targetValue,
    Boolean onTrack,
    Integer percentToGoal,
    String message,
    Double baselineValue) {}
