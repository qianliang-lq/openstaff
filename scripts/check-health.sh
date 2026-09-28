#!/usr/bin/env bash
# Check health of all backend services

set -e

echo "🏥 Checking OpenStaff services health..."
echo ""

check_service() {
    local name=$1
    local url=$2
    echo -n "Checking $name... "
    if curl -s "$url" > /dev/null; then
        echo "✅ healthy"
        curl -s "$url" | jq . || echo ""
    else
        echo "❌ unhealthy or not running"
    fi
    echo ""
}

check_service "API (port 3000)" "http://localhost:3000/health"
check_service "Gateway (port 3001)" "http://localhost:3001/health"
check_service "Scheduler (port 3002)" "http://localhost:3002/health"
check_service "Runtime (port 3003)" "http://localhost:3003/health"

echo "Done!"
