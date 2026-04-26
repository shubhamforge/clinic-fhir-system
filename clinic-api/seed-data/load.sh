#!/usr/bin/env bash
set -euo pipefail

FHIR_URL="${FHIR_URL:-http://localhost:8080/fhir}"
PATIENTS_DIR="$(dirname "$0")/patients"

if ! command -v curl &>/dev/null; then
  echo "ERROR: curl is required but not installed." >&2
  exit 1
fi

files=("$PATIENTS_DIR"/*.json)
if [ ${#files[@]} -eq 0 ] || [ ! -f "${files[0]}" ]; then
  echo "ERROR: No JSON files found in $PATIENTS_DIR" >&2
  echo "Generate data first: see seed-data/README.md" >&2
  exit 1
fi

echo "FHIR server : $FHIR_URL"
echo "Files found : ${#files[@]}"
echo "---"

success=0
failure=0

# Load hospitalInformation and practitionerInformation first — patient bundles
# reference Organizations, Locations, and Practitioners via conditional PUT,
# which only works if those resources already exist.
for file in "${files[@]}"; do
  [[ "$(basename "$file")" == hospitalInformation* ]] || \
  [[ "$(basename "$file")" == practitionerInformation* ]] || continue

  name="$(basename "$file")"
  response=$(curl -s -w "\n%{http_code}" \
    -X POST "$FHIR_URL" \
    -H "Content-Type: application/fhir+json" \
    --data-binary "@$file")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n -1)

  if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
    echo "[OK $http_code] $name (shared resources)"
    success=$((success + 1))
  else
    echo "[FAIL $http_code] $name" >&2
    echo "$body" | head -c 800 >&2
    echo >&2
    failure=$((failure + 1))
  fi
done

for file in "${files[@]}"; do
  [[ "$(basename "$file")" == hospitalInformation* ]] && continue
  [[ "$(basename "$file")" == practitionerInformation* ]] && continue
  name="$(basename "$file")"

  response=$(curl -s -w "\n%{http_code}" \
    -X POST "$FHIR_URL" \
    -H "Content-Type: application/fhir+json" \
    --data-binary "@$file")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n -1)

  if [[ "$http_code" == "200" || "$http_code" == "201" ]]; then
    echo "[OK $http_code] $name"
    success=$((success + 1))
  else
    echo "[FAIL $http_code] $name" >&2
    echo "$body" | head -c 800 >&2
    echo >&2
    failure=$((failure + 1))
  fi
done

echo "---"
echo "Done — $success succeeded, $failure failed."
[ "$failure" -eq 0 ]
