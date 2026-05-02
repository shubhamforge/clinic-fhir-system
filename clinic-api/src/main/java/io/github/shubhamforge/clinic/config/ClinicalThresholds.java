package io.github.shubhamforge.clinic.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "clinical.thresholds")
public record ClinicalThresholds(
    int systolicWarn,
    int systolicCritical,
    int diastolicWarn,
    int diastolicCritical,
    double spo2Warn,
    double spo2Critical) {}
