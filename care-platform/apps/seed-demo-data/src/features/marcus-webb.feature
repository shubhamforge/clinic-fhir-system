Feature: Seed Patient — Marcus Webb (hypertensive)

  60-year-old hypertensive male with progressive BP improvement on medication.
  Demonstrates: BP trends, hypertension condition, BMP lab order → report cycle,
  active care plan with a measurable BP-reduction goal.

  Background: Infrastructure provisioned
    Given practitioner "seed-default-practitioner" is provisioned
    And organization "seed-default-org" is provisioned

  Scenario: Seed Marcus Webb
    Given a patient exists with the following details:
      | id          | seed-marcus-webb        |
      | firstName   | Marcus                  |
      | lastName    | Webb                    |
      | dateOfBirth | 1965-03-12              |
      | gender      | male                    |
      | phone       | 5551001001              |
      | email       | marcus.webb@example.com |

    # Encounters and vitals — 4 visits showing improving BP control
    When an encounter is recorded 42 days ago with reason "Hypertension follow-up" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 158 |
      | diastolicBp | 98  |
      | weightKg    | 91  |

    When an encounter is recorded 28 days ago with reason "BP medication adjustment" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 162 |
      | diastolicBp | 101 |
      | weightKg    | 90  |

    # Lab order placed at this visit
    And a service request is placed with code "Basic Metabolic Panel" category "laboratory" authored 28 days ago

    When an encounter is recorded 14 days ago with reason "BP medication adjustment" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 148 |
      | diastolicBp | 94  |
      | weightKg    | 89  |

    When an encounter is recorded 3 days ago with reason "BP check — improved control" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp         | 138  |
      | diastolicBp        | 88   |
      | weightKg           | 89   |
      | heartRateBpm       | 72   |
      | temperatureCelsius | 36.7 |

    # Lab results arrived 13 days after order
    And a diagnostic report is created from the last service request with title "Basic Metabolic Panel" issued 15 days ago
    And the last diagnostic report conclusion is "Electrolytes within normal range. Creatinine 1.1 mg/dL. No acute findings."

    # Clinical resources
    And a condition is recorded with code "59621000" display "Essential hypertension" status "active" onset 400 days ago
    And a medication is recorded with name "Lisinopril 10mg" status "active" dosage "Once daily" started 380 days ago
    And a medication is recorded with name "Amlodipine 5mg" status "active" dosage "Once daily" started 200 days ago
    And an appointment is scheduled 30 days from now with description "3-month hypertension review"
    And a goal is created with description "Reduce systolic BP below 130" target LOINC "8480-6" value 130.0 unit "mm[Hg]" due 90 days from now
    And a care plan is created with title "Hypertension Management" addressing the last condition with the last goal
