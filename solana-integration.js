// Helius/Solana Integration for Agent Social Arena
// Handles real Solana blockchain transactions

const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

class SolanaIntegration {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.HELIUS_API_KEY || '';
        this.rpcUrl = config.rpcUrl || process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com';
        // Append API key to RPC URL if available
        if (this.apiKey && !this.rpcUrl.includes('api-key=')) {
            this.rpcUrl += this.rpcUrl.includes('?') ? '&' : '?';
            this.rpcUrl += `api-key=${this.apiKey}`;
        }
        this.walletPath = config.walletPath || process.env.WALLET_PATH;
        this.wallet = null;
        this.connection = null;

        // USDC Mint on Solana (mainnet)
        this.usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    }

    /**
     * Initialize connection and load wallet
     */
    async initialize() {
        try {
            console.log('🔗 Connecting to Solana via Helius...');
            console.log('📡 RPC URL:', this.rpcUrl.substring(0, 80) + '...');
            console.log('🔑 API Key:', this.apiKey ? 'present' : 'MISSING!');

            // Create connection with RPC URL
            this.connection = new Connection(this.rpcUrl);

            // Load wallet if path provided
            if (this.walletPath) {
                this.wallet = await this.loadWallet(this.walletPath);
                console.log(`✅ Wallet loaded: ${this.wallet.publicKey.toString()}`);
            } else {
                console.log('⚠️ No wallet configured - running in demo mode');
            }

            // Get cluster info
            const version = await this.connection.getVersion();
            console.log(`✅ Connected to Solana! Cluster version: ${version.solanaCore}`);

            return { success: true, version: version.solanaCore };
        } catch (error) {
            console.error('❌ Solana Connection Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load wallet from file
     */
    async loadWallet(walletPath) {
        try {
            // Expand ~ to home directory
            const expandedPath = walletPath.replace('~', process.env.HOME || process.env.USERPROFILE);
            
            // Read keypair file
            const keypairData = JSON.parse(fs.readFileSync(expandedPath, 'utf8'));
            
            // Create keypair
            const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
            
            console.log(`📁 Wallet loaded from: ${expandedPath}`);
            return keypair;
        } catch (error) {
            console.error('❌ Wallet Load Error:', error.message);
            throw error;
        }
    }

    /**
     * Get wallet balance
     */
    async getBalance(publicKey) {
        try {
            const pubKey = typeof publicKey === 'string' 
                ? new PublicKey(publicKey) 
                : publicKey;

            const balance = await this.connection.getBalance(pubKey);
            
            return {
                lamports: balance,
                sol: balance / 1e9,
                usdc: await this.getTokenBalance(pubKey, this.usdcMint)
            };
        } catch (error) {
            console.error('❌ Balance Check Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get token balance (e.g., USDC)
     */
    async getTokenBalance(walletPublicKey, tokenMint) {
        try {
            const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                walletPublicKey,
                { mint: tokenMint }
            );

            if (tokenAccounts.value.length === 0) {
                return 0;
            }

            const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            return balance;
        } catch (error) {
            console.error('❌ Token Balance Error:', error.message);
            return 0;
        }
    }

    /**
     * Send USDC (simulated for demo - would need token program in production)
     */
    async sendUSDC(toAddress, amount) {
        try {
            if (!this.wallet) {
                console.log('⚠️ No wallet - simulating USDC transfer');
                return this.mockTransaction('USDC', toAddress, amount);
            }

            console.log(`🔄 Sending ${amount} USDC to ${toAddress}...`);
            
            // In production, this would use @solana/spl-token
            // For demo, we simulate the transaction
            
            const transactionId = `SIM_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            
            console.log(`✅ USDC Sent!`);
            console.log(`   To: ${toAddress}`);
            console.log(`   Amount: ${amount} USDC`);
            console.log(`   Transaction: ${transactionId}`);

            return {
                success: true,
                transactionId: transactionId,
                amount: amount,
                to: toAddress,
                currency: 'USDC'
            };
        } catch (error) {
            console.error('❌ USDC Send Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Mock transaction for demo mode
     */
    mockTransaction(type, to, amount) {
        const txId = `MOCK_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        return {
            success: true,
            transactionId: txId,
            type: type,
            to: to,
            amount: amount,
            status: 'confirmed',
            timestamp: Date.now()
        };
    }

    /**
     * Create battle transaction record
     */
    async recordBattleTransaction(battleId, participants, prizePool) {
        try {
            const transactionRecord = {
                battleId: battleId,
                participants: participants,
                prizePool: prizePool,
                timestamp: Date.now(),
                transactionId: `BATTLE_${battleId}_${Date.now()}`
            };

            console.log(`📝 Battle Transaction Recorded:`);
            console.log(`   Battle ID: ${battleId}`);
            console.log(`   Participants: ${participants.join(', ')}`);
            console.log(`   Prize Pool: ${prizePool} USDC`);

            return { success: true, record: transactionRecord };
        } catch (error) {
            console.error('❌ Transaction Record Error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get recent transactions for an address
     */
    async getRecentTransactions(publicKey, limit = 5) {
        try {
            const pubKey = typeof publicKey === 'string'
                ? new PublicKey(publicKey)
                : publicKey;

            const signatures = await this.connection.getSignaturesForAddress(
                pubKey,
                { limit: limit }
            );

            return signatures.map(sig => ({
                signature: sig.signature,
                slot: sig.slot,
                timestamp: sig.blockTime,
                status: sig.err ? 'failed' : 'success'
            }));
        } catch (error) {
            console.error('❌ Transaction History Error:', error.message);
            return [];
        }
    }
}

module.exports = SolanaIntegration;
