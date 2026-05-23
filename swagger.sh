#!/usr/bin/env bash
# Serves docs/openapi.yaml via Swagger UI at http://localhost:8081
set -euo pipefail

SPEC="$(pwd)/docs/openapi.yaml"

if [[ ! -f "$SPEC" ]]; then
  echo "Error: $SPEC not found"
  exit 1
fi

echo "Starting Swagger UI → http://localhost:8081"
docker run --rm -p 8081:8080 \
  -e SWAGGER_JSON=/spec/openapi.yaml \
  -v "$SPEC:/spec/openapi.yaml:ro" \
  swaggerapi/swagger-ui
