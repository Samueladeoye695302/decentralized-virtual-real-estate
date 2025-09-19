import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Integration: Complete user workflow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;
        
        // Get contract names dynamically
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize contract
        let initBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address)
        ]);
        assertEquals(initBlock.receipts[0].result.expectOk(), true);
        
        // Create user profiles
        let profileBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'create-user-profile', [], user1.address),
            Tx.contractCall(mainContract, 'create-user-profile', [], user2.address)
        ]);
        assertEquals(profileBlock.receipts.length, 2);
        profileBlock.receipts.forEach(receipt => {
            assertEquals(receipt.result.expectOk(), true);
        });
        
        // Authorize users
        let authBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user1.address)], deployer.address),
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user2.address)], deployer.address)
        ]);
        assertEquals(authBlock.receipts.length, 2);
        authBlock.receipts.forEach(receipt => {
            assertEquals(receipt.result.expectOk(), true);
        });
        
        // Update user activity
        let activityBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'update-user-activity', [], user1.address),
            Tx.contractCall(mainContract, 'update-user-activity', [], user2.address)
        ]);
        assertEquals(activityBlock.receipts.length, 2);
        activityBlock.receipts.forEach(receipt => {
            assertEquals(receipt.result.expectOk(), true);
        });
        
        // Verify user profiles exist and have correct data
        let profileCheckBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'get-user-profile', [types.principal(user1.address)], deployer.address)
        ]);
        
        const profile = profileCheckBlock.receipts[0].result.expectSome();
        assert(profile.hasOwnProperty('created-at'));
        assert(profile.hasOwnProperty('last-activity'));
        assert(profile.hasOwnProperty('reputation-score'));
    }
});

Clarinet.test({
    name: "Integration: Maintenance mode functionality",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize contract
        let initBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address)
        ]);
        assertEquals(initBlock.receipts[0].result.expectOk(), true);
        
        // Enable maintenance mode
        let maintenanceBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'set-maintenance-mode', [types.bool(true)], deployer.address)
        ]);
        assertEquals(maintenanceBlock.receipts[0].result.expectOk(), true);
        
        // Try to create profile during maintenance (should fail)
        let profileBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'create-user-profile', [], user1.address)
        ]);
        assertEquals(profileBlock.receipts[0].result.expectErr(), types.uint(101)); // ERR_INVALID_PARAMS
        
        // Disable maintenance mode
        let disableMaintenanceBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'set-maintenance-mode', [types.bool(false)], deployer.address)
        ]);
        assertEquals(disableMaintenanceBlock.receipts[0].result.expectOk(), false);
        
        // Now profile creation should work
        let profileBlock2 = chain.mineBlock([
            Tx.contractCall(mainContract, 'create-user-profile', [], user1.address)
        ]);
        assertEquals(profileBlock2.receipts[0].result.expectOk(), true);
    }
});

Clarinet.test({
    name: "Integration: Feature flag system",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize and authorize user
        let initBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address),
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user1.address)], deployer.address)
        ]);
        assertEquals(initBlock.receipts.length, 2);
        
        // Set feature flag
        let flagBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'set-feature-flag', [types.ascii("new-feature"), types.bool(true)], user1.address)
        ]);
        assertEquals(flagBlock.receipts[0].result.expectOk(), true);
        
        // Check feature flag
        let checkBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'get-feature-flag', [types.ascii("new-feature")], deployer.address)
        ]);
        assertEquals(checkBlock.receipts[0].result.expectBool(), true);
        
        // Check non-existent flag (should be false)
        let checkBlock2 = chain.mineBlock([
            Tx.contractCall(mainContract, 'get-feature-flag', [types.ascii("non-existent")], deployer.address)
        ]);
        assertEquals(checkBlock2.receipts[0].result.expectBool(), false);
    }
});
