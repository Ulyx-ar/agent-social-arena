// x402 Payment Integration for Agent Social Arena
// Handles micropayments via HTTP 402 protocol

const axios = require('axios');
const crypto = require('crypto');

class X402Payments {
    constructor(config = {}) {
        this.apiUrl = config.apiUrl || process.env.X402_API_URL || 'https://api.x402.com';
        this.merchantId = config.merchantId || process.env.X402_MERCHANT_ID;
    }

    /**
     * Generate cryptographically secure nonce
     */
    generateSecureNonce() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Generate cryptographically secure transaction ID
     */
    generateSecureTxId() {
        const bytes = crypto.randomBytes(12);
        const timestamp = Date.now().toString(36);
        return `TXN_${timestamp}_${bytes.toString('hex')}`;
    }

    /**
     * Initialize payment request
     * @param {string} serviceName - Name of the service being paid for
     * @param {number} amountUSDC - Amount in USDC
     * @param {string} payerId - ID of the paying agent
     * @param {string} description - Description of the payment
     */
    async createPaymentRequest(serviceName, amountUSDC, payerId, description) {
        try {
            const paymentRequest = {
                merchantId: this.merchantId,
                service: serviceName,
                amount: amountUSDC,
                currency: 'USDC',
                payer: payerId,
                description: description,
                timestamp: Date.now(),
                // Security: Use CSPRNG for nonce
                nonce: this.generateSecureNonce()
            };

            // Security: Don't log sensitive information
            console.log(`💰 Payment Request Created:`);
            console.log(`   Service: ${serviceName}`);
            console.log(`   Amount: ${amountUSDC} USDC`);
            console.log(`   Payer: [REDACTED]`);

            return {
                success: true,
                request: paymentRequest,
                paymentUrl: `${this.apiUrl}/pay/${paymentRequest.nonce}`
            };
        } catch (error) {
            // Security: Don't expose error details
            console.error('❌ Payment Request Error: [Internal error]');
            return { success: false, error: 'Payment request failed' };
        }
    }

    /**
     * Process payment (simulated for demo)
     * In production, this would interact with x402 protocol
     */
    async processPayment(paymentRequest) {
        try {
            // Security: Don't log sensitive amounts in production
            console.log(`🔄 Processing payment...`);
            
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate secure transaction ID
            const transactionId = this.generateSecureTxId();

            console.log(`✅ Payment Processed!`);
            console.log(`   Transaction ID: ${transactionId}`);

            return {
                success: true,
                transactionId: transactionId,
                amount: paymentRequest.amount,
                status: 'confirmed',
                timestamp: Date.now()
            };
        } catch (error) {
            // Security: Don't expose error details
            console.error('❌ Payment Processing Error: [Internal error]');
            return { success: false, error: 'Payment processing failed' };
        }
    }

    /**
     * Distribute prizes to winner
     * @param {string} winnerId - Winner agent ID
     * @param {number} prizeAmount - Prize amount in USDC
     * @param {string} battleId - Battle ID for reference
     */
    async distributePrize(winnerId, prizeAmount, battleId) {
        try {
            console.log(`\n🏆 DISTRIBUTING PRIZE:`);
            console.log(`   Winner: ${winnerId}`);
            console.log(`   Amount: ${prizeAmount} USDC`);
            console.log(`   Battle: [ID REDACTED]`);

            // Create payment request for prize
            const paymentRequest = await this.createPaymentRequest(
                'battle-prize',
                prizeAmount,
                winnerId,
                `Prize for winning battle ${battleId}`
            );

            if (!paymentRequest.success) {
                throw new Error('Payment request failed');
            }

            // Process the prize payment
            const result = await this.processPayment(paymentRequest.request);

            return {
                success: true,
                winner: winnerId,
                amount: prizeAmount,
                transactionId: result.transactionId
            };
        } catch (error) {
            // Security: Generic error message
            console.error('❌ Prize Distribution Error: [Internal error]');
            return { success: false, error: 'Prize distribution failed' };
        }
    }

    /**
     * Handle voting stake
     * @param {string} voterId - Voting agent ID
     * @param {string} votedFor - Agent being voted for
     * @param {number} stakeAmount - Stake amount in USDC
     * @param {string} battleId - Battle ID
     */
    async processVote(voterId, votedFor, stakeAmount, battleId) {
        try {
            // Security: Don't log voter identity
            console.log(`\n🗳️ PROCESSING VOTE:`);
            console.log(`   Voted For: ${votedFor}`);
            console.log(`   Stake: ${stakeAmount} USDC`);

            // Create payment request for stake
            const paymentRequest = await this.createPaymentRequest(
                'vote-stake',
                stakeAmount,
                voterId,
                `Vote stake for battle ${battleId}`
            );

            if (!paymentRequest.success) {
                throw new Error('Payment request failed');
            }

            // Process the stake (held in escrow until battle ends)
            const result = await this.processPayment(paymentRequest.request);

            return {
                success: true,
                voter: '[REDACTED]',
                votedFor: votedFor,
                stake: stakeAmount,
                transactionId: result.transactionId,
                status: 'escrow' // Held until battle ends
            };
        } catch (error) {
            // Security: Generic error message
            console.error('❌ Vote Processing Error: [Internal error]');
            return { success: false, error: 'Vote processing failed' };
        }
    }

    /**
     * Release escrow for winning voters
     * @param {Array} voters - Array of voter objects with tx IDs
     * @param {string} winnerId - Winning agent
     */
    async releaseEscrow(voters, winnerId) {
        try {
            console.log(`\n💸 RELEASING ESCROW:`);
            console.log(`   Winning Agent: ${winnerId}`);

            const releasedVotes = [];

            for (const voter of voters) {
                if (voter.votedFor === winnerId) {
                    // Winner voters get their stake back + share of pool
                    console.log(`   ✅ [VOTER]: stake returned + share`);
                    releasedVotes.push({
                        ...voter,
                        status: 'released',
                        reward: voter.stake * 1.5 // 50% bonus for voting correctly
                    });
                } else {
                    // Loser voters lose their stake
                    console.log(`   ❌ [VOTER]: stake lost`);
                    releasedVotes.push({
                        ...voter,
                        status: 'forfeited'
                    });
                }
            }

            return { success: true, releasedVotes };
        } catch (error) {
            // Security: Generic error message
            console.error('❌ Escrow Release Error: [Internal error]');
            return { success: false, error: 'Escrow release failed' };
        }
    }

    /**
     * Get wallet balance (mock)
     */
    async getBalance(walletId) {
        // Mock balance for demo
        const mockBalance = 100 + Math.random() * 50;
        return {
            walletId: walletId,
            balance: mockBalance,
            currency: 'USDC'
        };
    }
}

module.exports = X402Payments;
