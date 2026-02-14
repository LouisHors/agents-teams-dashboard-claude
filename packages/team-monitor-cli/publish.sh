#!/bin/bash

# Team Monitor CLI - Publish Script

set -e

echo "=== Team Monitor CLI Publisher ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PACKAGE_DIR"

# Check npm login
echo -e "${BLUE}Checking npm login status...${NC}"
if ! npm whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}You are not logged in to npm${NC}"
    echo "Please run: npm adduser"
    echo ""
    npm adduser
fi

USERNAME=$(npm whoami)
echo -e "${GREEN}✓${NC} Logged in as: $USERNAME"
echo ""

# Check package name
echo -e "${BLUE}Validating package...${NC}"
PACKAGE_NAME=$(node -e "console.log(require('./package.json').name)")
PACKAGE_VERSION=$(node -e "console.log(require('./package.json').version)")

echo "Package: $PACKAGE_NAME"
echo "Version: $PACKAGE_VERSION"
echo ""

# Dry run
echo -e "${BLUE}Running npm pack (dry run)...${NC}"
npm pack --dry-run 2>&1 | tail -20
echo ""

# Confirm
read -p "Proceed with publish? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Publish cancelled${NC}"
    exit 1
fi

# Publish
echo ""
echo -e "${BLUE}Publishing to npm...${NC}"
npm publish --access public

echo ""
echo -e "${GREEN}✓ Published successfully!${NC}"
echo ""
echo "Install with:"
echo "  npm install -g $PACKAGE_NAME"
echo ""
echo "Or use directly:"
echo "  npx $PACKAGE_NAME"
