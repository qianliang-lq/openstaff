#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔥 OpenStaff Smoke Tests"
echo "========================="
echo ""

check_service() {
    local name=$1
    local port=$2
    local url="http://localhost:${port}/health"
    
    echo -n "Testing ${name} (port ${port})... "
    
    if ! response=$(curl -sf "${url}" 2>&1); then
        echo -e "${RED}FAIL${NC}"
        echo "  Error: Could not connect to ${url}"
        echo "  ${response}"
        return 1
    fi
    
    expected_service=$(echo "${name}" | tr '[:upper:]' '[:lower:]')
    
    status=$(echo "${response}" | jq -r '.status' 2>/dev/null || echo "ERROR")
    service=$(echo "${response}" | jq -r '.service' 2>/dev/null || echo "ERROR")
    
    if [[ "${status}" != "ok" ]] || [[ "${service}" != "${expected_service}" ]]; then
        echo -e "${RED}FAIL${NC}"
        echo "  Expected: {\"status\":\"ok\",\"service\":\"${expected_service}\"}"
        echo "  Got: ${response}"
        return 1
    fi
    
    echo -e "${GREEN}PASS${NC}"
    return 0
}

failed=0

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found. Installing is recommended for better test output.${NC}"
    echo ""
fi

check_service "api" 3000 || failed=$((failed + 1))
check_service "gateway" 3001 || failed=$((failed + 1))
check_service "scheduler" 3002 || failed=$((failed + 1))

echo ""
if [[ ${failed} -eq 0 ]]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ ${failed} test(s) failed${NC}"
    echo ""
    echo "Hint: Make sure all services are running:"
    echo "  just dev"
    exit 1
fi
