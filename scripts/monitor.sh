#!/bin/bash

# Monitoring script for blockchain project
set -e

echo "📊 Contract Monitoring Dashboard"
echo "================================"

NETWORK=${1:-testnet}
CONTRACT_ADDRESS=${2:-""}

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Usage: $0 <network> <contract-address>"
    echo "Example: $0 testnet ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.my-contract"
    exit 1
fi

echo "Network: $NETWORK"
echo "Contract: $CONTRACT_ADDRESS"
echo ""

# Contract Status
echo "📈 Contract Status:"
echo "├─ Active: $(clarinet console --$NETWORK -c "(contract-call? $CONTRACT_ADDRESS get-contract-status)" 2>/dev/null | tail -1 || echo "Error")"
echo "├─ Maintenance Mode: $(clarinet console --$NETWORK -c "(contract-call? $CONTRACT_ADDRESS is-maintenance-mode)" 2>/dev/null | tail -1 || echo "Error")"
echo "├─ Version: $(clarinet console --$NETWORK -c "(contract-call? $CONTRACT_ADDRESS get-contract-version)" 2>/dev/null | tail -1 || echo "Error")"
echo ""

# Analytics
echo "📊 Analytics:"
echo "├─ Total Operations: $(clarinet console --$NETWORK -c "(contract-call? $CONTRACT_ADDRESS get-total-operations)" 2>/dev/null | tail -1 || echo "Error")"
echo "├─ Daily Active Users: $(clarinet console --$NETWORK -c "(contract-call? $CONTRACT_ADDRESS get-daily-active-users)" 2>/dev/null | tail -1 || echo "Error")"
echo ""

# Recent Activity (last 5 operations)
echo "🕒 Recent Activity:"
for i in {0..4}; do
    result=$(clarinet console --$NETWORK -c "(contract-call? $CONTRACT_ADDRESS get-operation-log u$i)" 2>/dev/null | tail -1 || echo "none")
    if [ "$result" != "none" ] && [ "$result" != "(none)" ]; then
        echo "├─ Operation $i: $result"
    fi
done

echo ""
echo "✅ Monitoring complete"
