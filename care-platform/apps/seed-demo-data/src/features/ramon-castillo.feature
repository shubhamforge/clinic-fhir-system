Feature: Seed Patient — Ramon Castillo (T2DM + hypertension)

  66-year-old male with type 2 diabetes and hypertension, on triple therapy.
  Demonstrates: dual-condition management, HbA1c lab cycle (completed) + pending lipid panel
  (active ServiceRequest with no DiagnosticReport yet — shows "results pending" on dashboard),
  quarterly review cadence, dual-goal care plan.

  Background: Infrastructure provisioned
    Given practitioner "seed-default-practitioner" is provisioned
    And organization "seed-default-org" is provisioned

  Scenario: Seed Ramon Castillo
    Given a patient exists with the following details:
      | id          | seed-ramon-castillo        |
      | firstName   | Ramon                      |
      | lastName    | Castillo                   |
      | dateOfBirth | 1958-09-30                 |
      | gender      | male                       |
      | phone       | 5551005005                 |
      | email       | ramon.castillo@example.com |

    # HbA1c ordered at the 30-day visit (will be completed by a report below)
    And a service request is placed with code "HbA1c Panel" category "laboratory" authored 30 days ago

    # 4 encounters: quarterly reviews showing gradual improvement
    When an encounter is recorded 40 days ago with reason "Diabetes management — quarterly review" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 136 |
      | diastolicBp | 86  |
      | weightKg    | 98  |
      | spo2Percent | 96  |

    When an encounter is recorded 25 days ago with reason "Metformin dose review" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 133 |
      | diastolicBp | 84  |
      | weightKg    | 97  |
      | spo2Percent | 96  |

    # HbA1c result — fulfils the service request ordered 30 days ago
    And a diagnostic report is created from the last service request with title "HbA1c and Metabolic Panel" issued 15 days ago
    And the last diagnostic report conclusion is "HbA1c 7.2% — controlled but above 7.0% target. LDL 98 mg/dL. eGFR 72 — monitor. Continue current regimen."

    When an encounter is recorded 12 days ago with reason "Foot exam and neuropathy screen" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 130 |
      | diastolicBp | 82  |
      | weightKg    | 96  |
      | spo2Percent | 97  |

    # Lipid panel ordered at the most recent visit — intentionally left ACTIVE (no report)
    # This drives the "pending service requests" section of the dashboard
    And a service request is placed with code "Lipid Panel" category "laboratory" authored 1 days ago

    When an encounter is recorded 1 days ago with reason "HbA1c results review" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 128 |
      | diastolicBp | 80  |
      | weightKg    | 95  |
      | spo2Percent | 97  |

    # Clinical resources
    And a condition is recorded with code "44054006" display "Type 2 diabetes mellitus" status "active" onset 2200 days ago
    And a medication is recorded with name "Metformin 1000mg" status "active" dosage "Twice daily with meals" started 2200 days ago
    And a medication is recorded with name "Enalapril 5mg" status "active" dosage "Once daily" started 1400 days ago
    And a medication is recorded with name "Atorvastatin 20mg" status "active" dosage "Once nightly" started 1400 days ago
    And an appointment is scheduled 21 days from now with description "Quarterly diabetes and cardiovascular review"
    And a goal is created with description "Reduce HbA1c below 7.0%" target LOINC "4548-4" value 7.0 unit "%" due 180 days from now
    And a care plan is created with title "Diabetes and Hypertension Management" addressing the last condition with the last goal
