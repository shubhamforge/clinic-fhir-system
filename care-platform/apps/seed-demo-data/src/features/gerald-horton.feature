Feature: Seed Patient — Gerald Horton (sleep apnea, improving SpO2)

  49-year-old male with moderate OSA and low SpO2 improving with CPAP therapy.
  Demonstrates: SpO2 trending upward over 4 visits, sleep study lab order → report,
  active OSA condition, CPAP device medication entry, SpO2 goal in progress.

  Background: Infrastructure provisioned
    Given practitioner "seed-default-practitioner" is provisioned
    And organization "seed-default-org" is provisioned

  Scenario: Seed Gerald Horton
    Given a patient exists with the following details:
      | id          | seed-gerald-horton        |
      | firstName   | Gerald                    |
      | lastName    | Horton                    |
      | dateOfBirth | 1974-11-04                |
      | gender      | male                      |
      | phone       | 5551003003                |
      | email       | gerald.horton@example.com |

    # Sleep study ordered at first visit
    And a service request is placed with code "Polysomnography" category "procedure" authored 45 days ago

    # 4 encounters showing SpO2 recovery from 93% → 97%
    When an encounter is recorded 45 days ago with reason "Fatigue and shortness of breath" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 144 |
      | diastolicBp | 92  |
      | weightKg    | 118 |
      | spo2Percent | 93  |

    # Sleep study report arrives 5 days after the study
    And a diagnostic report is created from the last service request with title "Polysomnography — Sleep Study" issued 40 days ago
    And the last diagnostic report conclusion is "AHI 22 events/hour. Moderate obstructive sleep apnea. CPAP therapy initiated at 8 cmH2O."

    When an encounter is recorded 30 days ago with reason "Sleep study result and CPAP initiation" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 140 |
      | diastolicBp | 90  |
      | weightKg    | 117 |
      | spo2Percent | 94  |

    When an encounter is recorded 15 days ago with reason "CPAP titration follow-up" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 136 |
      | diastolicBp | 88  |
      | weightKg    | 116 |
      | spo2Percent | 96  |

    When an encounter is recorded 2 days ago with reason "Sleep quality improving — CPAP adherent" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 132 |
      | diastolicBp | 85  |
      | weightKg    | 115 |
      | spo2Percent | 97  |

    # Clinical resources
    And a condition is recorded with code "78275009" display "Obstructive sleep apnea" status "active" onset 480 days ago
    And a medication is recorded with name "CPAP therapy" status "active" dosage "Nightly CPAP at 8 cmH2O" started 40 days ago
    And an appointment is scheduled 14 days from now with description "CPAP compliance and SpO2 review"
    And a goal is created with description "Maintain SpO2 above 95% consistently" target LOINC "59408-5" value 95.0 unit "%" due 90 days from now
    And a care plan is created with title "Sleep Apnea Management" addressing the last condition with the last goal
