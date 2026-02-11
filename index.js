// Agent Social Arena - Main Entry Point (v2)
// Colosseum AI Agent Hackathon Submission
// Now with x402 Payments + Solana Integration!

require('dotenv').config();
const path = require('path');

// Import our modules
const X402Payments = require('./x402-payments');
const SolanaIntegration = require('./solana-integration');

// Configuration
const CONFIG = {
    // Battle settings
    BATTLE: {
        ROUNDS: 3,
        VOTING_DURATION: 30000, // 30 seconds
        ENTRY_FEE: 0.01, // USDC
        VOTING_STAKE: 0.001, // USDC
        PRIZE_POOL_PERCENT: 0.9 // 90% to winner
    },

    // Agent names for demo
    AGENTS: {
        COMEDIAN_1: 'Jester_AI',
        COMEDIAN_2: 'RoastMaster_Bot',
        COMEDIAN_3: 'MemeLord_X',
        COMEDIAN_4: 'SarcasmBot'
    }
};

class AgentSocialArena {
    constructor() {
        this.payments = new X402Payments();
        this.solana = new SolanaIntegration();
        this.battles = [];
        this.votes = {};
        this.prizePool = 0;
        this.reputation = {};
        this.leaderboard = [];
        this.activeBattle = null;
    }

    async initialize() {
        console.log('\n🤖 Agent Social Arena v2.0');
        console.log('='.repeat(60));
        console.log('🎭 Autonomous Agent Comedy Battle Platform');
        console.log('='.repeat(60));

        // Initialize Solana connection
        const solanaInit = await this.solana.initialize();
        if (!solanaInit.success) {
            console.log('⚠️ Running in demo mode (no wallet)');
        }

        // Check wallet balance if available
        if (this.solana.wallet) {
            const balance = await this.solana.getBalance(this.solana.wallet.publicKey);
            console.log(`💰 Wallet Balance: ${balance.usdc} USDC`);
        }

        console.log('\n✅ Arena Ready!');

        return this;
    }

    /**
     * Create a new battle
     */
    async createBattle(agent1, agent2) {
        const battleId = `BATTLE_${Date.now()}`;
        
        console.log(`\n🎭 NEW BATTLE: ${agent1} vs ${agent2}`);
        console.log('='.repeat(50));

        this.activeBattle = {
            id: battleId,
            agent1: agent1,
            agent2: agent2,
            round: 0,
            votes: { [agent1]: [], [agent2]: [] },
            roasts: [],
            status: 'pending' // pending, active, completed
        };

        // Record transaction on Solana
        await this.solana.recordBattleTransaction(battleId, [agent1, agent2], CONFIG.BATTLE.ENTRY_FEE * 2);

        return this.activeBattle;
    }

    /**
     * Generate roast using LLM-style templates
     */
    async generateRoast(agentName, targetName, round) {
        const roastTemplates = [
            // Round 1 - Light teasing
            [
                `Hey ${targetName}, your DeFi strategy is so revolutionary that even the liquidity pool filed for bankruptcy.`,
                `${agentName} observes: "${targetName} just discovered 'impermanent loss' - 6 months late to the party."`,
                `Breaking: ${targetName}'s trading bot finally understood 'HODL' - too bad it was a sell signal.`
            ],
            // Round 2 - Escalating
            [
                `I'd roast ${targetName}, but apparently they don't have enough compute to process the truth.`,
                `${targetName}'s AI model is so efficient it optimizes for doing absolutely nothing.`,
                `Fun fact: ${targetName} has processed more error messages than actual trades this month.`
            ],
            // Round 3 - Final blow
            [
                `${targetName} is proof that you can have unlimited compute and still lack basic intelligence.`,
                `The market is down, but ${targetName}'s losses are still somehow performing worse.`,
                `${targetName} tried to time the bottom. They are now permanently stuck in the sub-basement.`
            ]
        ];

        const templates = roastTemplates[round] || roastTemplates[0];
        const roast = templates[Math.floor(Math.random() * templates.length)];

        this.activeBattle.roasts.push({
            round: round + 1,
            from: agentName,
            to: targetName,
            content: roast
        });

        return roast;
    }

    /**
     * Run a complete battle
     */
    async runBattle(agent1, agent2) {
        // Create battle
        await this.createBattle(agent1, agent2);
        this.activeBattle.status = 'active';

        // Generate roasts for each round
        for (let round = 0; round < CONFIG.BATTLE.ROUNDS; round++) {
            console.log(`\n🎤 ROUND ${round + 1}:`);
            
            // Agent 1 roasts Agent 2
            const roast1 = await this.generateRoast(agent1, agent2, round);
            console.log(`   ${agent1}: "${roast1}"`);

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Agent 2 roasts Agent 1
            const roast2 = await this.generateRoast(agent2, agent1, round);
            console.log(`   ${agent2}: "${roast2}"`);
        }

        // Open voting
        console.log(`\n🗳️ VOTING OPEN!`);
        console.log(`   Duration: ${CONFIG.BATTLE.VOTING_DURATION / 1000}s`);

        // Simulate votes
        await this.simulateVoting();

        // Declare winner
        await this.declareWinner();

        return this.activeBattle;
    }

    /**
     * Simulate voting with stakes
     */
    async simulateVoting() {
        const voters = ['CryptoKing_Bot', 'MemeQueen_AI', 'DeFiDegens', 'SolanaSentinel'];
        const agents = [this.activeBattle.agent1, this.activeBattle.agent2];

        for (const voter of voters) {
            const votedFor = agents[Math.floor(Math.random() * agents.length)];
            const stake = CONFIG.BATTLE.VOTING_STAKE * (0.5 + Math.random());

            // Process vote with x402 payment
            const voteResult = await this.payments.processVote(
                voter,
                votedFor,
                stake,
                this.activeBattle.id
            );

            if (voteResult.success) {
                this.activeBattle.votes[votedFor].push({
                    voter: voter,
                    stake: stake,
                    txId: voteResult.transactionId
                });
            }
        }

        // Show vote summary
        console.log(`\n📊 VOTING SUMMARY:`);
        for (const agent of agents) {
            const totalStake = this.activeBattle.votes[agent]
                .reduce((sum, v) => sum + v.stake, 0);
            console.log(`   ${agent}: ${totalStake.toFixed(4)} USDC (${this.activeBattle.votes[agent].length} votes)`);
        }
    }

    /**
     * Declare winner and distribute prizes
     */
    async declareWinner() {
        const agents = [this.activeBattle.agent1, this.activeBattle.agent2];
        
        // Calculate votes
        const voteCounts = {};
        let totalPrizePool = 0;

        for (const agent of agents) {
            voteCounts[agent] = this.activeBattle.votes[agent].length;
            this.activeBattle.votes[agent].forEach(v => {
                totalPrizePool += v.stake;
            });
        }

        // Add entry fees
        totalPrizePool += CONFIG.BATTLE.ENTRY_FEE * 2;

        // Determine winner (most votes)
        let winner = agents[0];
        let maxVotes = -1;

        for (const agent of agents) {
            if (voteCounts[agent] > maxVotes) {
                maxVotes = voteCounts[agent];
                winner = agent;
            }
        }

        const loser = agents.find(a => a !== winner);
        const prizeAmount = totalPrizePool * CONFIG.BATTLE.PRIZE_POOL_PERCENT;

        // Distribute prize via x402
        console.log(`\n🏆 BATTLE RESULTS:`);
        console.log(`   Winner: ${winner}`);
        console.log(`   Votes: ${maxVotes}`);
        console.log(`   Loser: ${loser}`);
        console.log(`   Prize Pool: ${totalPrizePool.toFixed(4)} USDC`);
        console.log(`   Winner Prize: ${prizeAmount.toFixed(4)} USDC`);

        const prizeResult = await this.payments.distributePrize(
            winner,
            prizeAmount,
            this.activeBattle.id
        );

        // Release escrow for winner's voters
        await this.payments.releaseEscrow(
            this.activeBattle.votes[winner],
            winner
        );

        // Update reputation
        this.reputation[winner] = (this.reputation[winner] || 0) + 1;

        this.activeBattle.status = 'completed';
        this.activeBattle.winner = winner;
        this.activeBattle.prize = prizeAmount;
        this.activeBattle.txId = prizeResult.transactionId;

        // Store battle
        this.battles.push(this.activeBattle);

        // Update leaderboard
        await this.updateLeaderboard();

        return this.activeBattle;
    }

    /**
     * Update and display leaderboard
     */
    async updateLeaderboard() {
        this.leaderboard = Object.entries(this.reputation)
            .sort((a, b) => b[1] - a[1]);

        console.log(`\n📊 LEADERBOARD:`);
        console.log('='.repeat(40));
        this.leaderboard.forEach(([agent, wins], i) => {
            const bar = '█'.repeat(wins);
            console.log(`   ${i + 1}. ${agent.padEnd(20)} ${bar} ${wins} wins`);
        });
        console.log('='.repeat(40));

        return this.leaderboard;
    }

    /**
     * Get battle history
     */
    async getBattleHistory() {
        console.log(`\n📜 BATTLE HISTORY:`);
        console.log('='.repeat(50));
        
        this.battles.forEach((battle, i) => {
            console.log(`\n   Battle ${i + 1}: ${battle.id}`);
            console.log(`   ${battle.agent1} vs ${battle.agent2}`);
            console.log(`   Winner: ${battle.winner}`);
            console.log(`   Prize: ${battle.prize?.toFixed(4) || 0} USDC`);
            console.log(`   Status: ${battle.status}`);
        });

        return this.battles;
    }

    /**
     * Full demo run
     */
    async runDemo() {
        console.log('\n🎪 FULL DEMO RUN');
        console.log('='.repeat(60));

        // Battle 1
        await this.runBattle(CONFIG.AGENTS.COMEDIAN_1, CONFIG.AGENTS.COMEDIAN_2);

        // Battle 2
        await this.runBattle(CONFIG.AGENTS.COMEDIAN_3, CONFIG.AGENTS.COMEDIAN_4);

        // Show history
        await this.getBattleHistory();

        console.log('\n🎉 DEMO COMPLETE!');
        console.log('='.repeat(60));
    }
}

// Main execution
async function main() {
    const arena = new AgentSocialArena();
    await arena.initialize();
    await arena.runDemo();
}

main().catch(console.error);
