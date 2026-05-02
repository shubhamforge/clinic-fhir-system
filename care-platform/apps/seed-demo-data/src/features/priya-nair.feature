Feature: Seed Patient — Priya Nair (healthy, preventive care)

  32-year-old healthy female with seasonal allergies and normal vitals.
  Demonstrates: all-normal vitals, preventive wellness care plan,
  CBC lab order → report cycle, allergy condition with PRN medication.

  Background: Infrastructure provisioned
    Given practitioner "seed-default-practitioner" is provisioned
    And organization "seed-default-org" is provisioned

  Scenario: Seed Priya Nair
    Given a patient exists with the following details:
      | id          | seed-priya-nair        |
      | firstName   | Priya                  |
      | lastName    | Nair                   |
      | dateOfBirth | 1992-07-28             |
      | gender      | female                 |
      | phone       | 5551002002             |
      | email       | priya.nair@example.com |

    # Encounters and vitals — 2 visits, all normal
    When an encounter is recorded 38 days ago with reason "Annual wellness exam" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 112 |
      | diastolicBp | 72  |
      | weightKg    | 58  |
      | spo2Percent | 99  |

    # Lab order placed at wellness visit
    And a service request is placed with code "Complete Blood Count" category "laboratory" authored 38 days ago

    When an encounter is recorded 10 days ago with reason "Seasonal allergy consultation" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 110 |
      | diastolicBp | 70  |
      | weightKg    | 58  |
      | spo2Percent | 99  |

    # CBC results came back normal
    And a diagnostic report is created from the last service request with title "Complete Blood Count" issued 30 days ago
    And the last diagnostic report conclusion is "All values within normal range. Haemoglobin 13.5 g/dL. WBC 6.2 × 10³/µL."

    # Clinical resources
    And a condition is recorded with code "61582004" display "Seasonal allergic rhinitis" status "active" onset 400 days ago
    And a medication is recorded with name "Cetirizine 10mg" status "active" dosage "Once daily as needed" started 400 days ago
    And an appointment is scheduled 45 days from now with description "Annual physical examination"
    And a goal is created with description "Maintain SpO2 above 98%" target LOINC "59408-5" value 98.0 unit "%" due 365 days from now
    And a care plan is created with title "Wellness Maintenance" addressing the last condition with the last goal
