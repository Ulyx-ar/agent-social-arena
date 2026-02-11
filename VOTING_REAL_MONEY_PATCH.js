/**
 * PATCH: Update /api/arena/vote endpoint for real money
 * 
 * REPLACE the voteSuccess block in server.js with:
 */

// At top of server.js, add:
const BankrIntegration = require('./BANKR_INTEGRATION');

// In /api/arena/vote endpoint, REPLACE:
// ===============================
// OLD CODE (Demo Mode):
/*
const voteSuccess = true; // In production: check Bankr ARENA balance

if (voteSuccess) {
    state.votes[agent]++;
    // ... rest of code
}
*/

// NEW CODE (Real Money):
// ===============================
try {
    // In demo mode, skip balance (process.env.REAL_MONEY === 'true') {
        // Check AR check
    ifENA balance via Bankr
        const balanceResult = await BankrIntegration.checkArenaBalance(walletAddress);
        
        if (!balanceResult.success || balanceResult.balance < 1) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({
                success: false,
                error: 'Insufficient ARENA tokens',
                required: '1 ARENA',
                current: balanceResult.balance || 0,
                solution: 'Get ARENA tokens from Bankr dashboard'
            }));
            return;
        }
    }
    
    // Process vote (same as before)
    state.votes[agent]++;
    state.totalVotes++;
    state.totalPrizePool += 0.001;
    
    state.currentBattle.votes[state.currentBattle[agent]].push({
        voter: voterId,
        stake: '1 ARENA',
        txType: 'token_stake',
        verified: process.env.REAL_MONEY === 'true'
    });
    
    res.writeHead(200, headers);
    res.end(JSON.stringify({
        success: true,
        message: process.env.REAL_MONEY === 'true' 
            ? 'Vote verified with ARENA balance' 
            : 'Vote cast with ARENA stake (demo)',
        tokenStaked: '1 ARENA',
        votes: state.votes,
        prizePool: state.totalPrizePool.toFixed(4) + ' USDC',
        realMoney: process.env.REAL_MONEY === 'true'
    }));
    
} catch (error) {
    console.error('Vote error:', error);
    res.writeHead(500, headers);
    res.end(JSON.stringify({
        success: false,
        error: 'Vote processing failed'
    }));
}
// ===============================
