package io.github.shubhamforge.clinic.dto;

import java.util.List;
import java.util.Map;

public record BpSeries(
    List<DataPoint> systolic, List<DataPoint> diastolic, Map<String, Integer> referenceRange) {}
