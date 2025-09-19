import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Performance: Bulk operations",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const users = [accounts.get('wallet_1')!, accounts.get('wallet_2')!];
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize contract
        let initBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address)
        ]);
        assertEquals(initBlock.receipts[0].result.expectOk(), true);
        
        // Bulk create profiles (test performance with multiple operations)
        const bulkTxs = users.map(user => 
            Tx.contractCall(mainContract, 'create-user-profile', [], user.address)
        );
        
        let bulkBlock = chain.mineBlock(bulkTxs);
        assertEquals(bulkBlock.receipts.length, users.length);
        
        // Verify all succeeded
        bulkBlock.receipts.forEach((receipt, index) => {
            assertEquals(receipt.result.expectOk(), true);
        });
        
        // Bulk authorize users
        const authTxs = users.map(user => 
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user.address)], deployer.address)
        );
        
        let authBlock = chain.mineBlock(authTxs);
        assertEquals(authBlock.receipts.length, users.length);
        
        // Bulk activity updates
        const activityTxs = users.map(user => 
            Tx.contractCall(mainContract, 'update-user-activity', [], user.address)
        );
        
        let activityBlock = chain.mineBlock(activityTxs);
        assertEquals(activityBlock.receipts.length, users.length);
        activityBlock.receipts.forEach(receipt => {
            assertEquals(receipt.result.expectOk(), true);
        });
    }
});

Clarinet.test({
    name: "Performance: Sequential operations stress test",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize
        let initBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address)
        ]);
        assertEquals(initBlock.receipts[0].result.expectOk(), true);
        
        // Create profile and authorize
        let setupBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'create-user-profile', [], user.address),
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user.address)], deployer.address)
        ]);
        assertEquals(setupBlock.receipts.length, 2);
        
        // Perform multiple sequential activity updates (stress test)
        for (let i = 0; i < 5; i++) {
            let activityBlock = chain.mineBlock([
                Tx.contractCall(mainContract, 'update-user-activity', [], user.address)
            ]);
            assertEquals(activityBlock.receipts[0].result.expectOk(), true);
        }
        
        // Verify final state
        let checkBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'get-user-profile', [types.principal(user.address)], deployer.address)
        ]);
        checkBlock.receipts[0].result.expectSome();
    }
});
