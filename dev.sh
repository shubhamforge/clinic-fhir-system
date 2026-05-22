#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$SCRIPT_DIR/.dev.pids"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()      { echo -e "  ${GREEN}✔${NC}  $1"; }
pending() { echo -e "  ${YELLOW}…${NC}  $1"; }
err()     { echo -e "  ${RED}✖${NC}  $1"; }
info()    { echo -e "\n${BOLD}${CYAN}▶ $1${NC}"; }

IS_WINDOWS=false
[[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "${OS:-}" == "Windows_NT" ]] && IS_WINDOWS=true

check_port() {
  curl -s --connect-timeout 1 "http://localhost:$1/" > /dev/null 2>&1
}

kill_port() {
  local port=$1
  if $IS_WINDOWS; then
    local pid
    pid=$(netstat -ano 2>/dev/null | grep ":${port} " | grep -i listen | awk '{print $NF}' | head -1 || true)
    if [[ -n "$pid" && "$pid" != "0" ]]; then
      taskkill //PID "$pid" //F //T > /dev/null 2>&1 || true
    fi
  else
    local pid
    pid=$(lsof -ti ":$port" 2>/dev/null || true)
    [[ -n "$pid" ]] && kill -9 $pid 2>/dev/null || true
  fi
}

anything_running() {
  docker compose -f "$SCRIPT_DIR/infra/docker-compose.yml" ps --quiet 2>/dev/null | grep -q . \
    || [ -f "$PID_FILE" ]
}

# ── Ctrl+C handler ────────────────────────────────────────────────────────────
on_exit() {
  echo ""
  teardown
  exit 0
}
trap on_exit SIGINT SIGTERM

# ── Teardown ──────────────────────────────────────────────────────────────────
teardown() {
  info "Stopping services"

  if [ -f "$PID_FILE" ]; then
    while IFS= read -r pid; do
      if $IS_WINDOWS; then
        taskkill //PID "$pid" //F //T > /dev/null 2>&1 || true
      else
        kill -TERM "$pid" 2>/dev/null || true
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  for port in 9090 4200; do  # add 4201 when patient-app is enabled
    kill_port "$port"
  done

  docker compose -f "$SCRIPT_DIR/infra/docker-compose.yml" down > /dev/null 2>&1 || true
  ok "All services stopped"
}

# ── Startup ───────────────────────────────────────────────────────────────────
startup() {
  mkdir -p "$LOG_DIR"
  > "$PID_FILE"
  rm -f "$LOG_DIR"/*.log

  # 1. Infrastructure
  info "Infrastructure (Postgres + HAPI FHIR)"

  docker compose -f "$SCRIPT_DIR/infra/docker-compose.yml" up -d > "$LOG_DIR/docker.log" 2>&1
  ok "Containers started (logs → logs/docker.log)"

  # Poll the FHIR metadata endpoint directly — faster than waiting for Docker's
  # healthcheck (which has a 60s start_period before it even begins checking).
  pending "Waiting for HAPI FHIR on :8080 (up to 120s)..."
  HAPI_UP=false
  for i in $(seq 1 24); do
    if curl -sf --connect-timeout 2 http://localhost:8080/fhir/metadata > /dev/null 2>&1; then
      HAPI_UP=true
      break
    fi
    sleep 5
  done

  if $HAPI_UP; then
    ok "HAPI FHIR is healthy → http://localhost:8080/fhir"
  else
    err "HAPI FHIR did not respond in time — check logs/docker.log"
    exit 1
  fi

  # 2. Spring Boot
  info "clinic-api (Spring Boot :9090)"

  cd "$SCRIPT_DIR/clinic-api"
  if $IS_WINDOWS; then
    cmd //c mvnw.cmd spring-boot:run "-Dspring.output.ansi.enabled=NEVER" > "$LOG_DIR/clinic-api.log" 2>&1 &
  else
    ./mvnw spring-boot:run -Dspring.output.ansi.enabled=NEVER > "$LOG_DIR/clinic-api.log" 2>&1 &
  fi
  SPRING_PID=$!
  echo "$SPRING_PID" >> "$PID_FILE"
  cd "$SCRIPT_DIR"

  pending "Waiting for clinic-api on :9090 (up to 60s)..."
  SPRING_UP=false
  for i in $(seq 1 12); do
    if check_port 9090; then
      SPRING_UP=true
      break
    fi
    sleep 5
  done

  if $SPRING_UP; then
    ok "clinic-api is up → http://localhost:9090 (PID $SPRING_PID, logs → logs/clinic-api.log)"
  else
    err "clinic-api did not start — check logs/clinic-api.log"
    exit 1
  fi

  # 3. Frontend
  info "Frontend"

  cd "$SCRIPT_DIR/care-platform"

  NO_COLOR=1 npx nx serve clinician-app --port=4200 > "$LOG_DIR/clinician-app.log" 2>&1 &
  CLINICIAN_PID=$!
  echo "$CLINICIAN_PID" >> "$PID_FILE"
  ok "clinician-app starting → http://localhost:4200 (PID $CLINICIAN_PID, logs → logs/clinician-app.log)"

  # NO_COLOR=1 npx nx serve patient-app --port=4201 > "$LOG_DIR/patient-app.log" 2>&1 &
  # PATIENT_PID=$!
  # echo "$PATIENT_PID" >> "$PID_FILE"
  # ok "patient-app starting → http://localhost:4201 (PID $PATIENT_PID, logs → logs/patient-app.log)"

  cd "$SCRIPT_DIR"

  echo ""
  echo -e "${BOLD}All services started.${NC}"
  echo -e "  Postgres      → localhost:5432"
  echo -e "  HAPI FHIR     → http://localhost:8080/fhir"
  echo -e "  clinic-api    → http://localhost:9090"
  echo -e "  clinician-app → http://localhost:4200"
  # echo -e "  patient-app   → http://localhost:4201"
  echo ""
  echo -e "Logs are in ${CYAN}./logs/${NC} — tail any service in a separate terminal:"
  echo -e "  tail -f logs/clinic-api.log"
  echo -e "  tail -f logs/clinician-app.log"
  echo -e "  docker compose -f infra/docker-compose.yml logs -f hapi-fhir"
  echo ""
  echo -e "Press Ctrl+C to stop all services."

  # Sleep loop keeps the script alive so the trap can fire on Ctrl+C.
  # We can't rely on `wait $PID` because on Windows, npx spawns via a cmd.exe
  # wrapper whose PID exits immediately, orphaning the real node process.
  while true; do
    sleep 5
  done
}

# ── Command dispatch ──────────────────────────────────────────────────────────
CMD="${1:-restart}"

case "$CMD" in
  start)
    if anything_running; then
      echo -e "${YELLOW}Services are already running.${NC} Use './dev.sh restart' to restart or './dev.sh stop' to stop."
      exit 1
    fi
    startup
    ;;
  stop)
    if anything_running; then
      teardown
    else
      echo -e "${YELLOW}Nothing is running.${NC}"
    fi
    ;;
  restart)
    if anything_running; then
      teardown
    fi
    startup
    ;;
  *)
    echo -e "Usage: ${BOLD}./dev.sh${NC} [start|stop|restart]"
    echo -e "  start    — start all services (fails if already running)"
    echo -e "  stop     — stop all services"
    echo -e "  restart  — stop if running, then start  ${CYAN}(default)${NC}"
    exit 1
    ;;
esac
