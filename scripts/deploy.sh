#!/bin/bash

# Deployment script for blockchain project
set -e

echo "🚀 Starting deployment process..."

# Configuration
NETWORK=${1:-testnet}
ENVIRONMENT=${2:-development}

echo "├─ Network: $NETWORK"
echo "├─ Environment: $ENVIRONMENT"

# Pre-deployment checks
echo "├─ Running pre-deployment checks..."
npm run check
npm run test

echo "├─ ✅ All checks passed"

# Deploy contracts
echo "├─ Deploying contracts to $NETWORK..."
if [ "$NETWORK" = "mainnet" ]; then
    echo "⚠️  MAINNET DEPLOYMENT - Please confirm (y/N):"
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

clarinet publish --$NETWORK

echo "✅ Deployment completed successfully!"
echo "📋 Next steps:"
echo "   1. Verify contracts on explorer"
echo "   2. Update frontend configuration"
echo "   3. Run integration tests against live contracts"
