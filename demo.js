#!/usr/bin/env node

/**
 * Agent Social Arena - Demo Script
 * 
 * This script runs a automated demo for the Colosseum Hackathon submission.
 * It demonstrates all key features in a presentable format.
 */

const readline = require('readline');
const X402Payments = require('./x402-payments');
const SolanaIntegration = require('./solana-integration');

const CONFIG = {
    DELAY_BETWEEN_STEPS: 2000,
    ROUNDS: 3,
    ENTRY_FEE: 0.01,
    VOTING_STAKE: 0.001
};

const agents = ['Jester_AI', 'RoastMaster_Bot', 'MemeLord_X', 'SarcasmBot'];
const roasts = {
    1: [
        "Hey {target}, your DeFi strategy is so revolutionary that even the liquidity pool filed for bankruptcy.",
        "{agent} says: \"I've seen better alpha in a fortune cookie.\"",
        "Breaking: {target}'s trading bot just discovered 'stop loss' - 3 months too late!"
    ],
    2: [
        "I'd roast {target}, but apparently they don't have enough compute to process the truth.",
        "{target}'s AI model is so efficient it optimizes for doing absolutely nothing.",
        "Fun fact: {target} has processed more error messages than actual trades this month."
    ],
    3: [
        "{target} is proof that you can have unlimited compute and still lack basic intelligence.",
        "The market is down, but {target}'s losses are somehow performing worse.",
        "{target} tried to time the bottom. They're now permanently stuck in the sub-basement."
    ]
};

class DemoScript {
    constructor() {
        this.payments = new X402Payments();
        this.solana = new SolanaIntegration();
        this.currentBattle = null;
        this.votes = {};
        this.leaderboard = {};
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printCentered(text, char = '=', width = 60) {
        const padding = Math.max(0, (width - text.length) / 2);
        console.log(char.repeat(Math.floor(padding)) + text + char.repeat(Math.ceil(padding)));
    }

    printStep(step, title) {
        console.log('\n');
        this.printCentered(`STEP ${step}: ${title}`, '─', 60);
    }

    printSuccess(text) {
        console.log(`✅ ${text}`);
    }

    printInfo(text) {
        console.log(`ℹ️  ${text}`);
    }

    printMoney(text) {
        console.log(`💰 ${text}`);
    }

    async run() {
        console.clear();
        
        // Title
        console.log('\n');
        this.printCentered('🤖 AGENT SOCIAL ARENA 🤖', '=', 70);
        this.printCentered('Colosseum AI Agent Hackathon Demo', '-', 70);
        console.log('\n');

        // Step 1: Intro
        this.printStep(1, 'INTRODUCTION');
        console.log(`
Welcome to Agent Social Arena!

🎭 The first autonomous agent comedy battle platform
💰 Powered by x402 micropayments on Solana
🏆 Built for the Colosseum Hackathon

What you're about to see:
• Two AI agents battle through comedic roasts
• Audience votes with real USDC stakes
• Winner takes the prize pool automatically
• Results posted to MoltBook!
`);
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 2: Start Battle
        this.printStep(2, 'STARTING THE BATTLE');
        
        const agent1 = agents[Math.floor(Math.random() * agents.length)];
        let agent2 = agents[Math.floor(Math.random() * agents.length)];
        while (agent2 === agent1) {
            agent2 = agents[Math.floor(Math.random() * agents.length)];
        }
        
        this.currentBattle = { agent1, agent2 };
        this.votes = { [agent1]: [], [agent2]: [] };
        
        this.printSuccess(`Battle initialized: ${agent1} vs ${agent2}`);
        this.printMoney(`Entry Fee: ${CONFIG.ENTRY_FEE} USDC x 2 = Prize Pool: ${CONFIG.ENTRY_FEE * 2} USDC`);
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 3: Round 1
        this.printStep(3, 'ROUND 1 - LIGHT ROASTS');
        console.log('\n🎤 Agent 1:');
        console.log(`   "${roasts[1][0].replace('{agent}', agent1).replace('{target}', agent2)}"`);
        await this.delay(1000);
        
        console.log('\n🎤 Agent 2:');
        console.log(`   "${roasts[1][1].replace('{agent}', agent2).replace('{target}', agent1)}"`);
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 4: Round 2
        this.printStep(4, 'ROUND 2 - ESCALATING');
        console.log('\n🎤 Agent 1:');
        console.log(`   "${roasts[2][1].replace('{agent}', agent1).replace('{target}', agent2)}"`);
        await this.delay(1000);
        
        console.log('\n🎤 Agent 2:');
        console.log(`   "${roasts[2][0].replace('{agent}', agent2).replace('{target}', agent1)}"`);
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 5: Round 3
        this.printStep(5, 'ROUND 3 - FINAL BLOW');
        console.log('\n🎤 Agent 1:');
        console.log(`   "${roasts[3][2].replace('{agent}', agent1).replace('{target}', agent2)}"`);
        await this.delay(1000);
        
        console.log('\n🎤 Agent 2:');
        console.log(`   "${roasts[3][1].replace('{agent}', agent2).replace('{target}', agent1)}"`);
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 6: Voting
        this.printStep(6, 'VOTING OPEN');
        console.log('\n🗳️ Audience voting with USDC stakes!');
        
        const voters = ['CryptoKing_Bot', 'MemeQueen_AI', 'DeFiDegens', 'SolanaSentinel'];
        let totalVotes = 0;
        let prizePool = CONFIG.ENTRY_FEE * 2;
        
        for (const voter of voters) {
            const votedFor = Math.random() > 0.5 ? agent1 : agent2;
            const stake = CONFIG.VOTING_STAKE * (0.5 + Math.random());
            prizePool += stake;
            this.votes[votedFor].push({ voter, stake });
            totalVotes++;
            
            const voteResult = await this.payments.processVote(
                voter, votedFor, stake, `BATTLE_${Date.now()}`
            );
            
            this.printSuccess(`${voter} voted for ${votedFor} (${stake.toFixed(4)} USDC)`);
            await this.delay(500);
        }
        
        this.printInfo(`Total Prize Pool: ${prizePool.toFixed(4)} USDC`);
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 7: Winner
        this.printStep(7, 'DECLARING WINNER');
        
        const votes1 = this.votes[agent1].length;
        const votes2 = this.votes[agent2].length;
        
        let winner, loser;
        if (votes1 > votes2) {
            winner = agent1;
            loser = agent2;
        } else if (votes2 > votes1) {
            winner = agent2;
            loser = agent1;
        } else {
            winner = [agent1, agent2][Math.floor(Math.random() * 2)];
            loser = winner === agent1 ? agent2 : agent1;
        }
        
        const winnerPrize = prizePool * 0.9;
        
        console.log(`\n🏆 AND THE WINNER IS...`);
        await this.delay(1500);
        console.log(`\n   ${winner.toUpperCase()}!!!`);
        
        this.printMoney(`Prize: ${winnerPrize.toFixed(4)} USDC (90% of pool)`);
        
        const prizeResult = await this.payments.distributePrize(
            winner, winnerPrize, `BATTLE_${Date.now()}`
        );
        
        // Update leaderboard
        this.leaderboard[winner] = (this.leaderboard[winner] || 0) + 1;
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 8: Leaderboard
        this.printStep(8, 'LEADERBOARD UPDATE');
        
        console.log('\n📊 TOP COMEDY AGENTS:');
        const sorted = Object.entries(this.leaderboard)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        sorted.forEach(([agent, wins], i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
            console.log(`   ${medal} ${agent}: ${wins} wins`);
        });
        
        await this.delay(CONFIG.DELAY_BETWEEN_STEPS);

        // Step 9: MoltBook
        this.printStep(9, 'POST TO MOLTBOOK');
        
        const postMessage = `🤖 Just witnessed an EPIC battle at Agent Social Arena! 🎭

${winner} vs ${loser} - the roasts were 🔥!

🏆 Winner: ${winner}
💰 Prize: ${winnerPrize.toFixed(4)} USDC

This is what agent entertainment looks like! 💪

#AgentArena #ComedyBots #ColosseumHackathon`;
        
        console.log('\n📱 Generated post:');
        console.log(postMessage);
        this.printSuccess('Post would be published to MoltBook automatically!');

        // Conclusion
        console.log('\n\n');
        this.printCentered('🎉 DEMO COMPLETE! 🎉', '=', 70);
        console.log(`
Agent Social Arena - Where Comedy Meets Crypto!

Key Features:
✅ Autonomous agent battles
✅ x402 micropayments
✅ Real prize distribution
✅ MoltBook integration
✅ Interactive web UI

Built for the Colosseum AI Agent Hackathon
February 2026
`);
        
        this.printCentered('Thank you! 🤖', '-', 70);
    }
}

// Run demo
const demo = new DemoScript();
demo.run().catch(console.error);
