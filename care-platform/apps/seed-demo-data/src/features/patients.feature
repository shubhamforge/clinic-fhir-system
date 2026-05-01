Feature: Seed development patient data

  Five realistic patient profiles for frontend development and demo use.
  Each scenario deletes its own existing data (by fixed ID) before re-creating,
  so every run is idempotent and only touches seed-owned resources.

  Background: Default practitioner and organization are provisioned
    Given practitioner "seed-default-practitioner" is provisioned
    And organization "seed-default-org" is provisioned

  # ─────────────────────────────────────────────────────────────────────────
  # Patient 1 — Hypertensive male, ongoing BP monitoring, no SpO2 recorded
  # ─────────────────────────────────────────────────────────────────────────
  Scenario: Seed hypertensive patient — Marcus Webb
    Given a patient exists with the following details:
      | id          | seed-marcus-webb        |
      | firstName   | Marcus                  |
      | lastName    | Webb                    |
      | dateOfBirth | 1965-03-12              |
      | gender      | male                    |
      | phone       | 5551001001              |
      | email       | marcus.webb@example.com |

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

    When an encounter is recorded 14 days ago with reason "BP medication adjustment" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 148 |
      | diastolicBp | 94  |
      | weightKg    | 89  |

    When an encounter is recorded 3 days ago with reason "BP check — improved control" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 138 |
      | diastolicBp | 88  |
      | weightKg    | 89  |

  # ─────────────────────────────────────────────────────────────────────────
  # Patient 2 — Healthy young female, preventive care, all vitals normal
  # ─────────────────────────────────────────────────────────────────────────
  Scenario: Seed healthy patient — Priya Nair
    Given a patient exists with the following details:
      | id          | seed-priya-nair        |
      | firstName   | Priya                  |
      | lastName    | Nair                   |
      | dateOfBirth | 1992-07-28             |
      | gender      | female                 |
      | phone       | 5551002002             |
      | email       | priya.nair@example.com |

    When an encounter is recorded 38 days ago with reason "Annual wellness exam" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 112 |
      | diastolicBp | 72  |
      | weightKg    | 58  |
      | spo2Percent | 99  |

    When an encounter is recorded 10 days ago with reason "Seasonal allergy consultation" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 110 |
      | diastolicBp | 70  |
      | weightKg    | 58  |
      | spo2Percent | 99  |

  # ─────────────────────────────────────────────────────────────────────────
  # Patient 3 — Overweight male, low SpO2 improving with CPAP therapy
  # ─────────────────────────────────────────────────────────────────────────
  Scenario: Seed overweight low-SpO2 patient — Gerald Horton
    Given a patient exists with the following details:
      | id          | seed-gerald-horton        |
      | firstName   | Gerald                    |
      | lastName    | Horton                    |
      | dateOfBirth | 1974-11-04                |
      | gender      | male                      |
      | phone       | 5551003003                |
      | email       | gerald.horton@example.com |

    When an encounter is recorded 45 days ago with reason "Fatigue and shortness of breath" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 144 |
      | diastolicBp | 92  |
      | weightKg    | 118 |
      | spo2Percent | 93  |

    When an encounter is recorded 30 days ago with reason "Sleep study referral" and status "finished"
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

  # ─────────────────────────────────────────────────────────────────────────
  # Patient 4 — Post-cholecystectomy recovery, normalizing vitals
  # ─────────────────────────────────────────────────────────────────────────
  Scenario: Seed post-surgery patient — Sandra Okafor
    Given a patient exists with the following details:
      | id          | seed-sandra-okafor        |
      | firstName   | Sandra                    |
      | lastName    | Okafor                    |
      | dateOfBirth | 1980-02-19                |
      | gender      | female                    |
      | phone       | 5551004004                |
      | email       | sandra.okafor@example.com |

    When an encounter is recorded 44 days ago with reason "Cholecystectomy — pre-op assessment" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 118 |
      | diastolicBp | 76  |
      | weightKg    | 72  |
      | spo2Percent | 98  |

    When an encounter is recorded 35 days ago with reason "Cholecystectomy post-op day 1" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 122 |
      | diastolicBp | 78  |
      | weightKg    | 71  |
      | spo2Percent | 97  |

    When an encounter is recorded 21 days ago with reason "Post-op follow-up — wound check" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 116 |
      | diastolicBp | 74  |
      | weightKg    | 70  |
      | spo2Percent | 98  |

    When an encounter is recorded 7 days ago with reason "Post-op 4-week clearance" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 114 |
      | diastolicBp | 73  |
      | weightKg    | 69  |
      | spo2Percent | 99  |

  # ─────────────────────────────────────────────────────────────────────────
  # Patient 5 — Diabetic monitoring, gradual BP improvement and weight loss
  # ─────────────────────────────────────────────────────────────────────────
  Scenario: Seed diabetic monitoring patient — Ramon Castillo
    Given a patient exists with the following details:
      | id          | seed-ramon-castillo        |
      | firstName   | Ramon                      |
      | lastName    | Castillo                   |
      | dateOfBirth | 1958-09-30                 |
      | gender      | male                       |
      | phone       | 5551005005                 |
      | email       | ramon.castillo@example.com |

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

    When an encounter is recorded 12 days ago with reason "Foot exam and neuropathy screen" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 130 |
      | diastolicBp | 82  |
      | weightKg    | 96  |
      | spo2Percent | 97  |

    When an encounter is recorded 1 days ago with reason "HbA1c results review" and status "finished"
    And vitals are recorded for that encounter:
      | systolicBp  | 128 |
      | diastolicBp | 80  |
      | weightKg    | 95  |
      | spo2Percent | 97  |
