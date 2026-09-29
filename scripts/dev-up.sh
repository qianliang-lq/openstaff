#!/usr/bin/env bash
# OpenStaff One-Command Dev Bring-up
# Usage: ./scripts/dev-up.sh [--no-desktop]
#
# Starts all backend services + Desktop in background with sensible demo defaults.
# Press Ctrl-C to stop all services cleanly.

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
START_DESKTOP=1
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-desktop)
      START_DESKTOP=0
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--no-desktop]"
      exit 1
      ;;
  esac
done

# PID tracking
PIDS=()

# Cleanup function
cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Stopping all services...${NC}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
  echo -e "${GREEN}✅ All services stopped${NC}"
  exit 0
}

# Register cleanup on Ctrl-C
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🚀 OpenStaff Dev Environment Starting...${NC}"
echo ""

# Set demo defaults (can be overridden by existing env vars)
export OPENSTAFF_INSIGHT_DEMO="${OPENSTAFF_INSIGHT_DEMO:-1}"
export OPENSTAFF_GATEWAY_EGRESS_MODE="${OPENSTAFF_GATEWAY_EGRESS_MODE:-offline}"
export RUNTIME_SERVICE_TOKEN="${RUNTIME_SERVICE_TOKEN:-dev-runtime-token}"
export RUNTIME_URL="${RUNTIME_URL:-http://localhost:3003}"
export OPENSTAFF_GATEWAY_URL="${OPENSTAFF_GATEWAY_URL:-http://localhost:3001}"

echo -e "${BLUE}📋 Environment:${NC}"
echo "  OPENSTAFF_INSIGHT_DEMO=$OPENSTAFF_INSIGHT_DEMO"
echo "  OPENSTAFF_GATEWAY_EGRESS_MODE=$OPENSTAFF_GATEWAY_EGRESS_MODE"
echo "  RUNTIME_SERVICE_TOKEN=$RUNTIME_SERVICE_TOKEN"
echo "  RUNTIME_URL=$RUNTIME_URL"
echo "  OPENSTAFF_GATEWAY_URL=$OPENSTAFF_GATEWAY_URL"
echo ""

# Create artifacts directories
mkdir -p artifacts/gateway-audit
mkdir -p artifacts/external-insight

# Start backend services
echo -e "${GREEN}🔧 Starting backend services...${NC}"

echo "  Starting API (port 3000)..."
cargo run -p openstaff-api > /tmp/openstaff-api.log 2>&1 &
PIDS+=($!)

echo "  Starting Gateway (port 3001)..."
cargo run -p openstaff-gateway > /tmp/openstaff-gateway.log 2>&1 &
PIDS+=($!)

echo "  Starting Scheduler (port 3002)..."
cargo run -p openstaff-scheduler > /tmp/openstaff-scheduler.log 2>&1 &
PIDS+=($!)

echo "  Starting Runtime (port 3003)..."
cargo run -p openstaff-runtime > /tmp/openstaff-runtime.log 2>&1 &
PIDS+=($!)

# Wait for backend services to be ready
echo ""
echo -e "${YELLOW}⏳ Waiting for backend services to start...${NC}"
RETRIES=30
READY=0
for i in $(seq 1 $RETRIES); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1 && \
     curl -sf http://localhost:3001/health >/dev/null 2>&1 && \
     curl -sf http://localhost:3002/health >/dev/null 2>&1 && \
     curl -sf http://localhost:3003/health >/dev/null 2>&1; then
    READY=1
    break
  fi
  echo -n "."
  sleep 1
done
echo ""

if [ $READY -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Backend services not ready after ${RETRIES}s, but continuing...${NC}"
  echo -e "${YELLOW}   Check logs in /tmp/openstaff-*.log if issues occur${NC}"
else
  echo -e "${GREEN}✅ Backend services ready!${NC}"
fi

# Start Desktop frontend if requested
if [ $START_DESKTOP -eq 1 ]; then
  echo ""
  echo -e "${GREEN}🖥️  Starting Desktop frontend...${NC}"
  
  # Check if node_modules exist in apps/desktop
  if [ ! -d "apps/desktop/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Desktop dependencies not installed. Run: pnpm install${NC}"
    echo -e "${YELLOW}   Skipping Desktop startup...${NC}"
  else
    cd apps/desktop
    pnpm dev > /tmp/openstaff-desktop.log 2>&1 &
    PIDS+=($!)
    cd ../..
    
    # Brief wait for Vite to start
    sleep 2
    echo -e "${GREEN}✅ Desktop frontend starting...${NC}"
  fi
fi

# Print summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ OpenStaff Dev Environment Running!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📡 Backend Services:${NC}"
echo "  • API:       http://localhost:3000/health"
echo "  • Gateway:   http://localhost:3001/health"
echo "  • Scheduler: http://localhost:3002/health"
echo "  • Runtime:   http://localhost:3003/health"
echo ""

if [ $START_DESKTOP -eq 1 ] && [ -d "apps/desktop/node_modules" ]; then
  echo -e "${BLUE}🖥️  Frontend:${NC}"
  echo "  • Desktop:   http://localhost:5173"
  echo ""
fi

echo -e "${BLUE}📝 Logs:${NC}"
echo "  • Backend:  /tmp/openstaff-{api,gateway,scheduler,runtime}.log"
if [ $START_DESKTOP -eq 1 ]; then
  echo "  • Desktop:  /tmp/openstaff-desktop.log"
fi
echo ""

echo -e "${YELLOW}💡 Tips:${NC}"
echo "  • Check service health: just health"
echo "  • View logs: tail -f /tmp/openstaff-*.log"
echo "  • Stop services: Press Ctrl-C"
echo ""
echo -e "${GREEN}Press Ctrl-C to stop all services${NC}"
echo ""

# Wait for all background processes
wait
