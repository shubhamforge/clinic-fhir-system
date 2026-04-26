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
- `curl` (built into Windows 10+ and all Unix systems)
- `bash` (Git Bash or WSL on Windows — required for `load.sh`)

## Generating data with Synthea

### 1. Download Synthea

```bash
curl -LO https://github.com/synthetichealth/synthea/releases/latest/download/synthea-with-dependencies.jar
```

### 2. Generate patients

Works on all platforms (same command):
```bash
java -jar synthea-with-dependencies.jar -p 10 --exporter.fhir.export=true --exporter.baseDirectory=./synthea-output Massachusetts
```

`-p 10` generates 10 patients — adjust as needed. `Massachusetts` is the default Synthea state; you can substitute any US state name.

### 3. Copy output and clean up

Run from the project root:

**Bash (Git Bash / macOS / Linux):**
```bash
cp clinic-api/seed-data/synthea-output/fhir/*.json clinic-api/seed-data/patients/ && rm -rf clinic-api/seed-data/synthea-output
```

**Windows CMD:**
```cmd
xcopy /y clinic-api\seed-data\synthea-output\fhir\*.json clinic-api\seed-data\patients\ && rmdir /s /q clinic-api\seed-data\synthea-output
```

**Windows PowerShell:**
```powershell
Copy-Item clinic-api\seed-data\synthea-output\fhir\*.json clinic-api\seed-data\patients\
Remove-Item -Recurse -Force clinic-api\seed-data\synthea-output
```

The `synthea-output/` folder is deleted once the copy succeeds. If the copy fails the folder is left intact.

## Loading the data

Make sure the HAPI FHIR server is running and healthy first:

```bash
docker compose -f infra/docker-compose.yml up -d
# wait ~60 seconds, then verify:
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/fhir/metadata
# should return 200
```

Then run the loader from the project root.

**Bash (Git Bash / macOS / Linux):**
```bash
bash clinic-api/seed-data/load.sh
```

**Windows CMD (requires Git Bash or WSL in PATH):**
```cmd
bash clinic-api\seed-data\load.sh
```

To target a different FHIR server:

**Bash:**
```bash
FHIR_URL=http://other-host:8080/fhir bash clinic-api/seed-data/load.sh
```

**Windows CMD:**
```cmd
set FHIR_URL=http://other-host:8080/fhir && bash clinic-api\seed-data\load.sh
```

**Windows PowerShell:**
```powershell
$env:FHIR_URL = "http://other-host:8080/fhir"; bash clinic-api\seed-data\load.sh
```

## Notes

- Synthea generates two special files alongside patient files: `hospitalInformation*.json` (Organizations, Locations) and `practitionerInformation*.json` (Practitioners). The loader processes these first so patient bundles can resolve their references correctly.
- Re-running the loader is safe — Synthea bundles use `ifNoneExist` and conditional PUT so HAPI creates or updates resources without duplicating them.
- The `patients/` folder is listed in `.gitignore` — generated data should not be committed.
