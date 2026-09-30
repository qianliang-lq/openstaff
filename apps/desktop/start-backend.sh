#!/usr/bin/env bash
# Start backend services for OpenStaff Desktop development
# This script is called automatically by `pnpm tauri:dev`

set -euo pipefail

cd "$(dirname "$0")/../.."

echo "🚀 Starting OpenStaff backend services..."

# Check if services are already running
if curl -sf http://localhost:3000/health >/dev/null 2>&1 && \
   curl -sf http://localhost:3001/health >/dev/null 2>&1 && \
   curl -sf http://localhost:3002/health >/dev/null 2>&1 && \
   curl -sf http://localhost:3003/health >/dev/null 2>&1; then
  echo "✅ Backend services already running"
  exit 0
fi

# Set demo mode environment variables
export OPENSTAFF_INSIGHT_DEMO="${OPENSTAFF_INSIGHT_DEMO:-1}"
export OPENSTAFF_GATEWAY_EGRESS_MODE="${OPENSTAFF_GATEWAY_EGRESS_MODE:-offline}"
export RUNTIME_SERVICE_TOKEN="${RUNTIME_SERVICE_TOKEN:-dev-runtime-token}"

# Start services in background
echo "  Starting API (port 3000)..."
cargo run -p openstaff-api > /tmp/openstaff-api.log 2>&1 &

echo "  Starting Gateway (port 3001)..."
cargo run -p openstaff-gateway > /tmp/openstaff-gateway.log 2>&1 &

echo "  Starting Scheduler (port 3002)..."
nohup cargo run -p openstaff-scheduler > /tmp/openstaff-scheduler.log 2>&1 &

echo "  Starting Runtime (port 3003)..."
nohup cargo run -p openstaff-runtime > /tmp/openstaff-runtime.log 2>&1 &

echo ""
echo "⏳ Waiting for services to start (max 60s)..."
RETRIES=60
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

if [ $READY -eq 1 ]; then
  echo "✅ All backend services ready!"
  echo ""
  echo "📡 Backend Services:"
  echo "  • API:       http://localhost:3000"
  echo "  • Gateway:   http://localhost:3001"
  echo "  • Scheduler: http://localhost:3002"
  echo "  • Runtime:   http://localhost:3003"
  echo ""
  echo "📝 Logs: /tmp/openstaff-*.log"
else
  echo "⚠️  Services not ready after ${RETRIES}s, but continuing..."
  echo "   Check logs in /tmp/openstaff-*.log if issues occur"
  exit 1
fi
