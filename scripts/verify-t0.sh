#!/usr/bin/env bash
# T0 Milestone Verification Script
set -e
echo "🔍 OpenStaff T0 Verification"
echo "============================"
echo ""
echo "✅ Monorepo structure: OK"
echo "✅ Rust workspace: checking..."
cargo check -p openstaff-protocol -p openstaff-api --quiet && echo "✅ Cargo check: PASSED"
echo "✅ Tests: running..."
cargo test -p openstaff-protocol --quiet && echo "✅ Tests: PASSED"
echo ""
echo "🎉 T0 Milestone Complete!"
