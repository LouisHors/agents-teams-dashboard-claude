#!/bin/bash

# Local testing script for team-monitor-cli

set -e

echo "=== Testing Team Monitor CLI ==="
echo ""

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="/tmp/team-monitor-test-$$"

echo "1. Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"

echo "2. Installing package locally..."
cd "$TEST_DIR"
npm install "$PACKAGE_DIR"

echo "3. Testing CLI commands..."

echo "   - Testing 'doctor' command..."
./node_modules/.bin/team-monitor doctor

echo "   - Testing 'status' command..."
./node_modules/.bin/team-monitor status

echo ""
echo "=== Local Test Complete ==="
echo ""
echo "To test the full package:"
echo "  cd $TEST_DIR"
echo "  ./node_modules/.bin/team-monitor start"
echo ""
echo "Or after global install:"
echo "  npm install -g $PACKAGE_DIR"
echo "  team-monitor start"
echo ""

# Cleanup option
read -p "Clean up test directory? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$TEST_DIR"
    echo "Test directory cleaned up"
fi
