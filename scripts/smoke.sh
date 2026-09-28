#!/usr/bin/env bash
# Smoke test for OpenStaff backend services
# Requires services to be running (online test, not suitable for offline CI)

set -e

echo "💨 Running OpenStaff smoke tests..."
echo ""
echo "Note: This requires all backend services to be running."
echo "      Run 'just dev-services' in another terminal first."
echo ""

# Function to check if a service responds with HTTP 200
check_service_smoke() {
    local name=$1
    local url=$2
    local http_code
    
    echo -n "Smoke testing $name... "
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$http_code" = "200" ]; then
        echo "✅ passed (HTTP 200)"
        return 0
    else
        echo "❌ failed (HTTP $http_code)"
        return 1
    fi
}

# Track failures
failed=0

# Test all three backend services
check_service_smoke "API (port 3000)" "http://localhost:3000/health" || ((failed++))
check_service_smoke "Gateway (port 3001)" "http://localhost:3001/health" || ((failed++))
check_service_smoke "Scheduler (port 3002)" "http://localhost:3002/health" || ((failed++))

echo ""
if [ $failed -eq 0 ]; then
    echo "✅ All smoke tests passed!"
    exit 0
else
    echo "❌ $failed smoke test(s) failed"
    exit 1
fi
