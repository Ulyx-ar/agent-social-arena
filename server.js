// Agent Social Arena - Web Server
// Serves the UI and provides REST API

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import our modules
const X402Payments = require('./x402-payments');
const SolanaIntegration = require('./solana-integration');

const PORT = process.env.PORT || 3000;

// Security: Allowed CORS origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// Configuration
const CONFIG = {
    AGENTS: ['Jester_AI', 'RoastMaster_Bot', 'MemeLord_X', 'SarcasmBot', 'CryptoComedian', 'DeFiJester'],
    BATTLE: {
        ENTRY_FEE: 0.01,
        VOTING_STAKE: 0.001,
        ROUNDS: 3
    },
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100
    }
};

// Rate limiting state
const rateLimitMap = new Map();

// In-memory state
const state = {
    totalBattles: 0,
    totalPrizePool: 0,
    totalVotes: 0,
    activeAgents: CONFIG.AGENTS,
    currentBattle: null,
    votes: { agent1: 0, agent2: 0 },
    leaderboard: [
        { name: 'Jester_AI', wins: 0 },
        { name: 'RoastMaster_Bot', wins: 0 },
        { name: 'MemeLord_X', wins: 0 }
    ],
    battleHistory: []
};

// Initialize modules
const payments = new X402Payments();
const solana = new SolanaIntegration();

/**
 * Generate cryptographically secure random ID
 */
function generateSecureId(prefix) {
    const bytes = crypto.randomBytes(8);
    const id = bytes.toString('hex');
    return `${prefix}_${id}`;
}

/**
 * Rate limiting check - returns true if request should be blocked
 */
function checkRateLimit(clientId) {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT.WINDOW_MS;
    
    if (!rateLimitMap.has(clientId)) {
        rateLimitMap.set(clientId, []);
    }
    
    const requests = rateLimitMap.get(clientId);
    
    // Clean old requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    rateLimitMap.set(clientId, validRequests);
    
    // Check limit
    if (validRequests.length >= CONFIG.RATE_LIMIT.MAX_REQUESTS) {
        return true; // Rate limited
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitMap.set(clientId, validRequests);
    
    return false;
}

class ArenaServer {
    constructor() {
        this.server = null;
    }
    
    async initialize() {
        console.log('🔗 Initializing Solana connection...');
        await solana.initialize();
        console.log('✅ Server ready!');
    }
    
    /**
     * Serve static files with path traversal protection
     */
    serveStatic(filePath, contentType) {
        // Security: Validate and sanitize file path
        const safeFileName = path.basename(filePath);
        const fullPath = path.join(__dirname, safeFileName);
        
        // Security: Ensure path stays within project directory
        const resolvedPath = path.resolve(__dirname, safeFileName);
        if (!resolvedPath.startsWith(__dirname)) {
            return { status: 403, content: 'Forbidden', contentType: 'text/plain' };
        }
        
        try {
            const content = fs.readFileSync(fullPath);
            return { status: 200, content, contentType };
        } catch (error) {
            return { status: 404, content: 'File not found', contentType: 'text/plain' };
        }
    }
    
    /**
     * Get random roast
     */
    generateRoast(agentName, targetName, round) {
        const roasts = [
            // Round 1 - Light
            [
                `Hey ${targetName}, your DeFi strategy is so revolutionary that even the liquidity pool filed for bankruptcy.`,
                `${agentName} says: "${targetName} just discovered 'impermanent loss' - 6 months too late."`,
                `Breaking: ${targetName}'s trading bot finally understood 'HODL' - too bad it was a sell signal.`
            ],
            // Round 2 - Medium
            [
                `I'd roast ${targetName}, but apparently they don't have enough compute to process the truth.`,
                `${targetName}'s AI model is so efficient it optimizes for doing absolutely nothing.`,
                `Fun fact: ${targetName} has processed more error messages than actual trades this month.`
            ],
            // Round 3 - Heavy
            [
                `${targetName} is proof that you can have unlimited compute and still lack basic intelligence.`,
                `The market is down, but ${targetName}'s losses are still somehow performing worse.`,
                `${targetName} tried to time the bottom. They are now permanently stuck in the sub-basement.`
            ]
        ];
        
        const roundRoasts = roasts[round] || roasts[0];
        return roundRoasts[Math.floor(Math.random() * roundRoasts.length)];
    }
    
    /**
     * Handle API requests
     */
    async handleRequest(req, res) {
        // Security: Validate CORS origin
        const origin = req.headers.origin || '';
        const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
        
        const headers = {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        };
        
        // CORS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, headers);
            res.end();
            return;
        }
        
        // Security: Rate limiting
        const clientId = req.socket.remoteAddress || 'unknown';
        if (checkRateLimit(clientId)) {
            res.writeHead(429, headers);
            res.end(JSON.stringify({ success: false, error: 'Too many requests' }));
            return;
        }
        
        const url = new URL(req.url, `http://localhost:${PORT}`);
        const pathName = url.pathname;
        
        try {
            // API Routes
            if (pathName === '/api/status') {
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    state: {
                        totalBattles: state.totalBattles,
                        totalPrizePool: state.totalPrizePool,
                        totalVotes: state.totalVotes,
                        activeAgents: state.activeAgents,
                        leaderboard: state.leaderboard
                    }
                }));
                return;
            }
            
            if (pathName === '/api/battle/start') {
                // Create new battle with secure ID
                const agent1 = state.activeAgents[Math.floor(Math.random() * state.activeAgents.length)];
                let agent2 = state.activeAgents[Math.floor(Math.random() * state.activeAgents.length)];
                while (agent2 === agent1) {
                    agent2 = state.activeAgents[Math.floor(Math.random() * state.activeAgents.length)];
                }
                
                state.currentBattle = {
                    id: generateSecureId('BATTLE'),
                    agent1: agent1,
                    agent2: agent2,
                    round: 0,
                    roasts: [],
                    votes: { [agent1]: [], [agent2]: [] },
                    status: 'active'
                };
                
                state.votes = { agent1: 0, agent2: 0 };
                
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    battle: state.currentBattle
                }));
                return;
            }
            
            if (pathName === '/api/battle/roast') {
                // Get next roast
                if (!state.currentBattle || state.currentBattle.status !== 'active') {
                    res.writeHead(400, headers);
                    res.end(JSON.stringify({ success: false, error: 'No active battle' }));
                    return;
                }
                
                const round = state.currentBattle.round;
                if (round >= CONFIG.BATTLE.ROUNDS) {
                    res.writeHead(400, headers);
                    res.end(JSON.stringify({ success: false, error: 'Battle complete' }));
                    return;
                }
                
                // Generate roasts for both agents
                const roast1 = this.generateRoast(state.currentBattle.agent1, state.currentBattle.agent2, round);
                const roast2 = this.generateRoast(state.currentBattle.agent2, state.currentBattle.agent1, round);
                
                state.currentBattle.roasts.push({ round: round + 1, roast1, roast2 });
                state.currentBattle.round++;
                
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    round: state.currentBattle.round,
                    roasts: { roast1, roast2 }
                }));
                return;
            }
            
            if (pathName === '/api/battle/vote') {
                // Cast vote with strict input validation
                if (!state.currentBattle || state.currentBattle.status !== 'active') {
                    res.writeHead(400, headers);
                    res.end(JSON.stringify({ success: false, error: 'No active battle' }));
                    return;
                }
                
                const agent = url.searchParams.get('agent');
                const allowedAgents = ['agent1', 'agent2'];
                if (!agent || !allowedAgents.includes(agent)) {
                    res.writeHead(400, headers);
                    res.end(JSON.stringify({ success: false, error: 'Invalid agent parameter' }));
                    return;
                }
                
                // Use secure ID generation
                const voterId = generateSecureId('VOTER');
                
                // Process vote with x402
                const voteResult = await payments.processVote(
                    voterId,
                    state.currentBattle[agent],
                    CONFIG.BATTLE.VOTING_STAKE,
                    state.currentBattle.id
                );
                
                state.votes[agent]++;
                state.totalVotes++;
                state.totalPrizePool += CONFIG.BATTLE.VOTING_STAKE;
                
                state.currentBattle.votes[state.currentBattle[agent]].push({
                    voter: voterId,
                    stake: CONFIG.BATTLE.VOTING_STAKE,
                    txId: voteResult.transactionId
                });
                
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    votes: state.votes,
                    voteResult
                }));
                return;
            }
            
            if (pathName === '/api/battle/end') {
                // End battle and declare winner
                if (!state.currentBattle || state.currentBattle.status !== 'active') {
                    res.writeHead(400, headers);
                    res.end(JSON.stringify({ success: false, error: 'No active battle' }));
                    return;
                }
                
                const votes1 = state.currentBattle.votes[state.currentBattle.agent1].length;
                const votes2 = state.currentBattle.votes[state.currentBattle.agent2].length;
                
                let winner, loser;
                if (votes1 > votes2) {
                    winner = state.currentBattle.agent1;
                    loser = state.currentBattle.agent2;
                } else if (votes2 > votes1) {
                    winner = state.currentBattle.agent2;
                    loser = state.currentBattle.agent1;
                } else {
                    // Use CSPRNG for tiebreaker
                    const winnerIndex = crypto.randomInt(0, 2);
                    winner = [state.currentBattle.agent1, state.currentBattle.agent2][winnerIndex];
                    loser = winner === state.currentBattle.agent1 ? state.currentBattle.agent2 : state.currentBattle.agent1;
                }
                
                const prizePool = CONFIG.BATTLE.ENTRY_FEE * 2 + (state.totalVotes * CONFIG.BATTLE.VOTING_STAKE);
                const prize = prizePool * 0.9;
                
                // Distribute prize via x402
                const prizeResult = await payments.distributePrize(winner, prize, state.currentBattle.id);
                
                // Update leaderboard
                const winnerEntry = state.leaderboard.find(a => a.name === winner);
                if (winnerEntry) {
                    winnerEntry.wins++;
                }
                
                // Store battle
                state.battleHistory.push({
                    ...state.currentBattle,
                    winner,
                    loser,
                    prize,
                    status: 'completed'
                });
                
                state.totalBattles++;
                state.currentBattle.status = 'completed';
                
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    winner,
                    loser,
                    prize,
                    votes: { [winner]: votes1, [loser]: votes2 },
                    leaderboard: state.leaderboard
                }));
                return;
            }
            
            if (pathName === '/api/leaderboard') {
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    leaderboard: state.leaderboard.sort((a, b) => b.wins - a.wins)
                }));
                return;
            }
            
            if (pathName === '/api/history') {
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    history: state.battleHistory
                }));
                return;
            }
            
            // Serve HTML
            if (pathName === '/' || pathName === '/index.html') {
                const response = this.serveStatic('index.html', 'text/html');
                res.writeHead(response.status, { 'Content-Type': response.contentType });
                res.end(response.content);
                return;
            }
            
            // 404
            res.writeHead(404, headers);
            res.end(JSON.stringify({ success: false, error: 'Not found' }));
            
        } catch (error) {
            console.error('Request error:', error);
            // Security: Don't expose error details
            res.writeHead(500, headers);
            res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
        }
    }
    
    /**
     * Start server
     */
    start() {
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        
        this.server.listen(PORT, () => {
            console.log(`
🎭 Agent Social Arena Server
============================
🌐 Server running at: http://localhost:${PORT}
📊 API Endpoints:
   GET  /api/status       - Get arena status
   POST /api/battle/start - Start new battle
   GET  /api/battle/roast - Get next roast round
   POST /api/battle/vote  - Cast vote (agent=agent1|agent2)
   POST /api/battle/end    - End battle & declare winner
   GET  /api/leaderboard   - Get leaderboard
   GET  /api/history       - Get battle history
============================
            `);
        });
    }
}

// Main execution
async function main() {
    const server = new ArenaServer();
    await server.initialize();
    server.start();
}

main().catch(console.error);
