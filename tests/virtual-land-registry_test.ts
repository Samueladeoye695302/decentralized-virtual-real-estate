import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure virtual-land-registry can be initialized",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'initialize', [], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), true);
        
        // Verify contract status
        let statusBlock = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'get-contract-status', [], deployer.address)
        ]);
        
        assertEquals(statusBlock.receipts[0].result.expectBool(), true);
    },
});

Clarinet.test({
    name: "Ensure user authorization works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        
        // Initialize contract
        let initBlock = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'initialize', [], deployer.address)
        ]);
        assertEquals(initBlock.receipts[0].result.expectOk(), true);
        
        // Authorize user
        let authBlock = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'authorize-user', [types.principal(wallet1.address)], deployer.address)
        ]);
        assertEquals(authBlock.receipts[0].result.expectOk(), true);
        
        // Check authorization
        let checkBlock = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'is-user-authorized', [types.principal(wallet1.address)], deployer.address)
        ]);
        assertEquals(checkBlock.receipts[0].result.expectBool(), true);
    },
});

Clarinet.test({
    name: "Ensure emergency controls work",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        
        // Initialize contract
        let initBlock = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'initialize', [], deployer.address)
        ]);
        assertEquals(initBlock.receipts[0].result.expectOk(), true);
        
        // Emergency pause
        let pauseBlock = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'emergency-pause', [], deployer.address)
        ]);
        assertEquals(pauseBlock.receipts[0].result.expectOk(), true);
        
        // Check contract status is false
        let statusBlock = chain.mineBlock([
            Tx.contractCall('virtual-land-registry', 'get-contract-status', [], deployer.address)
        ]);
        assertEquals(statusBlock.receipts[0].result.expectBool(), false);
    },
});
