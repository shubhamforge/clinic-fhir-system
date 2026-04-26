# seed-data

Synthetic patient data for local development and testing, generated using [Synthea](https://github.com/synthetichealth/synthea). Each output file is a FHIR R4 transaction Bundle containing a full patient record — demographics, encounters, observations, conditions, medications, and more.

The `patients/` folder is intentionally empty in the repo. Follow the steps below to generate data locally before running the loader.

## Contents

```
seed-data/
├── patients/       # Generated Synthea FHIR bundles go here (git-ignored)
├── load.sh         # Script to POST all bundles to the HAPI FHIR server
└── README.md
```

## Prerequisites

- Java 11+ (required to run Synthea)
- `curl` (for the load script)

## Generating data with Synthea

### 1. Download Synthea

```bash
curl -LO https://github.com/synthetichealth/synthea/releases/latest/download/synthea-with-dependencies.jar
```

### 2. Generate patients

```bash
java -jar synthea-with-dependencies.jar -p 10 --exporter.fhir.export=true --exporter.baseDirectory=./synthea-output Massachusetts
```

`-p 10` generates 10 patients — adjust as needed. `Massachusetts` is the default Synthea state; you can substitute any US state name.

### 3. Copy output and clean up

Run from the project root:

```bash
cp clinic-api/seed-data/synthea-output/fhir/*.json clinic-api/seed-data/patients/ && rm -rf clinic-api/seed-data/synthea-output
```

The `synthea-output/` folder is deleted automatically once the copy succeeds. If the copy fails the folder is left intact.

## Loading the data

Make sure the HAPI FHIR server is running and healthy first:

```bash
docker compose -f infra/docker-compose.yml up -d
# wait ~60 seconds, then verify:
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/fhir/metadata
# should return 200
```

Then run the loader from the project root:

```bash
bash clinic-api/seed-data/load.sh
```

To target a different FHIR server:

```bash
FHIR_URL=http://other-host:8080/fhir bash clinic-api/seed-data/load.sh
```

## Notes

- Synthea generates two special files alongside patient files: `hospitalInformation*.json` (Organizations, Locations) and `practitionerInformation*.json` (Practitioners). The loader processes these first so patient bundles can resolve their references correctly.
- Re-running the loader is safe — Synthea bundles use `ifNoneExist` and conditional PUT so HAPI creates or updates resources without duplicating them.
- The `patients/` folder is listed in `.gitignore` — generated data should not be committed.
