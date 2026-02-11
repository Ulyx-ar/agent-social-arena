/**
 * PATCH: Update /api/battle/end endpoint for real money prize distribution
 * 
 * FIND this section in server.js and UPDATE:
 */

// In /api/battle/end endpoint, FIND:
// ===============================
/*
const prizePool = CONFIG.BATTLE.ENTRY_FEE * 2 + (state.totalVotes * CONFIG.BATTLE.VOTING_STAKE);
const prize = prizePool * 0.9;

// Distribute prize via x402
const prizeResult = await payments.distributePrize(winner, prize, state.currentBattle.id);
*/

// REPLACE WITH:
// ===============================
const prizePool = CONFIG.BATTLE.ENTRY_FEE * 2 + (state.totalVotes * CONFIG.BATTLE.VOTING_STAKE);
const prize = prizePool * 0.9;
const arenaTreasury = prizePool * 0.1;

let prizeResult;
let treasuryResult;

if (process.env.REAL_MONEY === 'true') {
    // Send real prizes via Bankr
    const winnerResult = await BankrIntegration.sendPrize(winnerWallet, prize);
    const treasuryResultObj = await BankrIntegration.sendPrize(arenaTreasuryAddress, arenaTreasury);
    
    prizeResult = {
        success: true,
        transactionId: winnerResult.transactionId,
        amount: prize,
        to: 'winner'
    };
    
    treasuryResult = {
        success: treasuryResultObj.success,
        transactionId: treasuryResultObj.transactionId,
        amount: arenaTreasury,
        to: 'treasury'
    };
} else {
    // Demo mode - mock
    prizeResult = {
        success: true,
        transactionId: 'demo_tx_' + Date.now(),
        amount: prize,
        message: 'Demo: Prize would be sent to ' + winner
    };
    
    treasuryResult = {
        success: true,
        transactionId: 'demo_treasury_' + Date.now(),
        amount: arenaTreasury,
        message: 'Demo: Treasury would receive ' + arenaTreasury
    };
}
// ===============================

// Then UPDATE the response to include treasury:
res.writeHead(200, headers);
res.end(JSON.stringify({
    success: true,
    battle: {
        id: state.currentBattle.id,
        winner,
        loser,
        totalVotes: state.totalVotes,
        prizePool: prizePool.toFixed(4) + ' USDC'
    },
    prize: {
        winnerPrize: prize.toFixed(4) + ' USDC',
        treasuryPrize: arenaTreasury.toFixed(4) + ' USDC',
        distribution: prizeResult,
        treasuryDistribution: treasuryResult
    },
    votes: { [winner]: votes1, [loser]: votes2 }
}));
// ===============================
