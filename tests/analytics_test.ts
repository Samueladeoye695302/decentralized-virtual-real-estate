import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Analytics: User activity tracking",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize and setup
        let setupBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address),
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user1.address)], deployer.address)
        ]);
        assertEquals(setupBlock.receipts.length, 2);
        
        // Record user activity
        let activityBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'record-user-activity', [types.principal(user1.address)], deployer.address)
        ]);
        assertEquals(activityBlock.receipts[0].result.expectOk(), true);
        
        // Check analytics summary
        let summaryBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'get-analytics-summary', [], deployer.address)
        ]);
        
        const summary = summaryBlock.receipts[0].result.expectTuple();
        assert(summary.hasOwnProperty('daily-active-users'));
        assert(summary.hasOwnProperty('total-operations'));
        assert(summary.hasOwnProperty('contract-version'));
        assert(summary.hasOwnProperty('maintenance-mode'));
        assert(summary.hasOwnProperty('current-block'));
    }
});

Clarinet.test({
    name: "Analytics: Activity streak tracking",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize and setup
        let setupBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address),
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user1.address)], deployer.address)
        ]);
        assertEquals(setupBlock.receipts.length, 2);
        
        // Record multiple activities to build streak
        for (let i = 0; i < 3; i++) {
            let activityBlock = chain.mineBlock([
                Tx.contractCall(mainContract, 'record-user-activity', [types.principal(user1.address)], deployer.address)
            ]);
            assertEquals(activityBlock.receipts[0].result.expectOk(), true);
        }
        
        // Check activity streak
        let streakBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'get-user-activity-streak', [types.principal(user1.address)], deployer.address)
        ]);
        
        assertEquals(streakBlock.receipts[0].result.expectUint(), 3);
    }
});

Clarinet.test({
    name: "Analytics: Daily stats management",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const contractNames = Object.keys(chain.contracts);
        const mainContract = contractNames[0];
        
        // Initialize and setup
        let setupBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'initialize', [], deployer.address),
            Tx.contractCall(mainContract, 'authorize-user', [types.principal(user1.address)], deployer.address)
        ]);
        assertEquals(setupBlock.receipts.length, 2);
        
        // Record user activity
        let activityBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'record-user-activity', [types.principal(user1.address)], deployer.address)
        ]);
        assertEquals(activityBlock.receipts[0].result.expectOk(), true);
        
        // Check daily active users
        let dailyUsersBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'get-daily-active-users', [], deployer.address)
        ]);
        
        // Should have at least 1 daily active user
        const dailyUsers = dailyUsersBlock.receipts[0].result.expectUint();
        assert(dailyUsers >= 1);
        
        // Reset daily stats (owner only)
        let resetBlock = chain.mineBlock([
            Tx.contractCall(mainContract, 'reset-daily-stats', [], deployer.address)
        ]);
        assertEquals(resetBlock.receipts[0].result.expectOk(), true);
    }
});
