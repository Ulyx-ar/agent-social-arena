/**
 * Bankr Integration for Real Money Mode
 * Add this to server.js for real ARENA balance checks and prize distribution
 */

// Bankr API helper functions
const BANKR_API_URL = 'https://api.bankr.bot';
const BANKR_API_KEY = process.env.BANKR_API_KEY;

/**
 * Check ARENA token balance on Bankr/Solana
 */
async function checkArenaBalance(walletAddress) {
    try {
        const response = await fetch(`${BANKR_API_URL}/agent/prompt`, {
            method: 'POST',
            headers: {
                'X-API-Key': BANKR_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: `What is my ARENA token balance on Solana?`
            })
        });
        
        const result = await response.json();
        
        // Poll for completion
        let jobStatus = result;
        while (jobStatus.status === 'pending') {
            await sleep(2000);
            const statusRes = await fetch(`${BANKR_API_URL}/agent/job/${result.jobId}`, {
                headers: { 'X-API-Key': BANKR_API_KEY }
            });
            jobStatus = await statusRes.json();
        }
        
        if (jobStatus.status === 'completed') {
            // Parse balance from response
            const balance = parseBalance(jobStatus.response);
            return { success: true, balance };
        }
        
        return { success: false, error: 'Failed to check balance' };
    } catch (error) {
        console.error('Balance check error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send USDC prize to winner via Bankr
 */
async function sendPrize(winnerAddress, amountUSDC) {
    try {
        const response = await fetch(`${BANKR_API_URL}/agent/prompt`, {
            method: 'POST',
            headers: {
                'X-API-Key': BANKR_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: `Send ${amountUSDC} USDC to ${winnerAddress} on Solana`
            })
        });
        
        const result = await response.json();
        
        // Poll for completion
        let jobStatus = result;
        while (jobStatus.status === 'pending') {
            await sleep(2000);
            const statusRes = await fetch(`${BANKR_API_URL}/agent/job/${result.jobId}`, {
                headers: { 'X-API-Key': BANKR_API_KEY }
            });
            jobStatus = await statusRes.json();
        }
        
        if (jobStatus.status === 'completed') {
            return { 
                success: true, 
                transactionId: jobStatus.response.txId || 'pending',
                message: 'Prize sent successfully'
            };
        }
        
        return { success: false, error: 'Prize transfer failed' };
    } catch (error) {
        console.error('Prize send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Helper to parse balance from Bankr response
 */
function parseBalance(responseText) {
    // Bankr returns plain text, need to extract number
    const match = responseText.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    checkArenaBalance,
    sendPrize
};
