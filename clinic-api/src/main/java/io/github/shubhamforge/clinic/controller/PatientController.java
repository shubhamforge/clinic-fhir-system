package io.github.shubhamforge.clinic.controller;

import io.github.shubhamforge.clinic.dto.PatientRequest;
import io.github.shubhamforge.clinic.service.PatientService;
import io.github.shubhamforge.clinic.service.SummaryService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.Patient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

  private final PatientService patientService;
  private final SummaryService summaryService;

  public PatientController(PatientService patientService, SummaryService summaryService) {
    this.patientService = patientService;
    this.summaryService = summaryService;
  }

  @PostMapping
  public ResponseEntity<Patient> createPatient(@Valid @RequestBody PatientRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(patientService.createPatient(request));
  }

  @GetMapping("/{id}")
  public ResponseEntity<Patient> getPatient(@PathVariable String id) {
    return ResponseEntity.ok(patientService.getPatient(id));
  }

  @GetMapping
  public ResponseEntity<Bundle> searchPatients(
      @RequestParam(required = false) String name, @RequestParam(required = false) LocalDate dob) {
    return ResponseEntity.ok(patientService.searchPatients(name, dob));
  }

  @GetMapping("/{id}/summary")
  public ResponseEntity<Bundle> getSummary(@PathVariable String id) {
    return ResponseEntity.ok(summaryService.getSummary(id));
  }
}
