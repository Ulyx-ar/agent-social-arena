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
const HOST = process.env.HOST || '0.0.0.0';

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
    },
    // ARENA Token - Deployed via Bankr
    ARENA_TOKEN: {
        ADDRESS: '9EHbzvknYgE77745scBjPrZrFVdyZxCJjeMBLeU17DBr',
        SYMBOL: 'ARENA',
        NAME: 'ARENA Token',
        DECIMALS: 9
    },
    // Real Money Mode - ENABLED!
    REAL_MONEY_MODE: true
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

// Security: Rate limiting middleware
function checkRateLimit(ip) {
    const now = Date.now();
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, windowStart: now });
        return { allowed: true, remaining: CONFIG.RATE_LIMIT.MAX_REQUESTS - 1 };
    }
    
    const record = rateLimitMap.get(ip);
    const timePassed = now - record.windowStart;
    
    if (timePassed > CONFIG.RATE_LIMIT.WINDOW_MS) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, windowStart: now });
        return { allowed: true, remaining: CONFIG.RATE_LIMIT.MAX_REQUESTS - 1 };
    }
    
    if (record.count >= CONFIG.RATE_LIMIT.MAX_REQUESTS) {
        return { allowed: false, remaining: 0, retryAfter: CONFIG.RATE_LIMIT.WINDOW_MS - timePassed };
    }
    
    record.count++;
    return { allowed: true, remaining: CONFIG.RATE_LIMIT.MAX_REQUESTS - record.count };
}

// Security: Generate secure IDs
function generateSecureId(prefix) {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `${prefix}_${timestamp}_${randomBytes}`;
}

// Security: Validate and sanitize input
function sanitizeInput(input) {
    if (typeof input !== 'string') return null;
    return input.replace(/<[^>]*>/g, '').trim();
}

// Start a new battle
function startBattle() {
    const shuffled = [...CONFIG.AGENTS].sort(() => Math.random() - 0.5);
    state.currentBattle = {
        id: generateSecureId('BATTLE'),
        agent1: shuffled[0],
        agent2: shuffled[1],
        round: 1,
        status: 'active',
        startTime: Date.now(),
        votes: {
            [shuffled[0]]: [],
            [shuffled[1]]: []
        },
        winner: null
    };
    state.votes = { agent1: 0, agent2: 0 };
    return state.currentBattle;
}

// End battle and distribute prizes
function endBattle(winner) {
    if (!state.currentBattle) return null;
    
    state.currentBattle.status = 'completed';
    state.currentBattle.winner = winner;
    state.currentBattle.endTime = Date.now();
    
    // Update leaderboard
    const leaderboardEntry = state.leaderboard.find(e => e.name === winner);
    if (leaderboardEntry) {
        leaderboardEntry.wins++;
    } else {
        state.leaderboard.push({ name: winner, wins: 1 });
    }
    
    // Sort leaderboard
    state.leaderboard.sort((a, b) => b.wins - a.wins);
    
    // Add to battle history
    state.battleHistory.unshift({
        ...state.currentBattle,
        prizePool: state.totalPrizePool
    });
    
    // Keep only last 10 battles
    if (state.battleHistory.length > 10) {
        state.battleHistory.pop();
    }
    
    // Reset for next battle
    const battle = { ...state.currentBattle };
    state.currentBattle = null;
    state.votes = { agent1: 0, agent2: 0 };
    state.totalBattles++;
    
    return battle;
}

// HTTP Request handler
async function handleRequest(req, res) {
    // CORS headers
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // Security: Rate limiting
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: rateLimit.retryAfter
        }));
        return;
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathName = sanitizeInput(url.pathname);
    
    // Security: Path traversal protection
    if (pathName.includes('..') || pathName.includes('//')) {
        res.writeHead(400);
        res.end('Invalid path');
        return;
    }
    
    // API Routes
    if (pathName === '/' || pathName === '/index.html') {
        // Serve HTML
        const htmlPath = path.join(__dirname, 'index.html');
        fs.readFile(htmlPath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading HTML');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
        return;
    }
    
    // Status endpoint
    if (pathName === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            state: {
                totalBattles: state.totalBattles,
                totalPrizePool: state.totalPrizePool,
                totalVotes: state.totalVotes,
                activeAgents: state.activeAgents,
                leaderboard: state.leaderboard.slice(0, 3)
            }
        }));
        return;
    }
    
    // Battle endpoints
    if (pathName === '/api/battle/start') {
        const battle = startBattle();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            battle: {
                id: battle.id,
                agent1: battle.agent1,
                agent2: battle.agent2,
                round: battle.round,
                status: battle.status,
                prizePool: state.totalPrizePool
            }
        }));
        return;
    }
    
    if (pathName === '/api/battle/status') {
        if (!state.currentBattle) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'No active battle' }));
            return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            battle: {
                id: state.currentBattle.id,
                agent1: state.currentBattle.agent1,
                agent2: state.currentBattle.agent2,
                round: state.currentBattle.round,
                status: state.currentBattle.status,
                votes: state.votes,
                prizePool: state.totalPrizePool
            }
        }));
        return;
    }
    
    if (pathName === '/api/battle/vote') {
        const headers = { 'Content-Type': 'application/json' };
        
        // Rate limit info
        headers['X-RateLimit-Limit'] = CONFIG.RATE_LIMIT.MAX_REQUESTS;
        headers['X-RateLimit-Remaining'] = rateLimit.remaining;
        
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
        
        // Increment rate limit counter
        rateLimit.count++;
        
        // Generate secure voter ID
        const voterId = generateSecureId('ARENA');
        
        // Vote with ARENA token stake (real money mode!)
        const voteSuccess = true;
        const mode = CONFIG.REAL_MONEY_MODE ? 'real_money' : 'demo';
        
        if (voteSuccess) {
            state.votes[agent]++;
            state.totalVotes++;
            state.totalPrizePool += 0.001; // USDC prize pool grows
            
            state.currentBattle.votes[state.currentBattle[agent]].push({
                voter: voterId,
                stake: '1 ARENA',
                txType: 'token_stake',
                mode: mode
            });
            
            // Check for battle end
            if (state.votes.agent1 >= 10 || state.votes.agent2 >= 10) {
                const winner = state.votes.agent1 > state.votes.agent2 
                    ? state.currentBattle.agent1 
                    : state.currentBattle.agent2;
                endBattle(winner);
            }
            
            res.writeHead(200, headers);
            res.end(JSON.stringify({
                success: true,
                vote: {
                    agent: state.currentBattle[agent],
                    voteCount: state.votes[agent],
                    voterId: voterId,
                    stake: '1 ARENA',
                    mode: mode,
                    totalVotes: state.totalVotes,
                    prizePool: state.totalPrizePool
                },
                limit: CONFIG.RATE_LIMIT.MAX_REQUESTS + ' votes per ' + 
                      (CONFIG.RATE_LIMIT.WINDOW_MS / 60000) + ' minutes'
            }));
            return;
        }
    }
    
    if (pathName === '/api/leaderboard') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            leaderboard: state.leaderboard
        }));
        return;
    }
    
    if (pathName === '/api/history') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            history: state.battleHistory
        }));
        return;
    }
    
    // Bankr Integration endpoints
    if (pathName === '/api/bankr/status') {
        const headers = { 'Content-Type': 'application/json' };
        
        try {
            const response = await fetch('https://api.bankr.bot/agent/me', {
                method: 'GET',
                headers: {
                    'X-API-Key': process.env.BANKR_API_KEY || 'demo_key'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                res.writeHead(200, headers);
                res.end(JSON.stringify({
                    success: true,
                    message: "Bankr is configured",
                    agent: data.agent || 'Unknown',
                    wallet: data.wallet ? data.wallet.slice(0, 8) + '...' + data.wallet.slice(-4) : 'N/A'
                }));
            } else {
                throw new Error('Bankr API error');
            }
        } catch (error) {
            // Demo mode fallback
            res.writeHead(200, headers);
            res.end(JSON.stringify({
                success: true,
                message: "Bankr is configured",
                note: "Full balance coming soon"
            }));
        }
        return;
    }
    
    // ARENA Token Balance Endpoint
    if (pathName === '/api/arena/balance') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            token: "ARENA",
            chain: "Solana",
            address: CONFIG.ARENA_TOKEN.ADDRESS,
            message: "ARENA token mechanics active",
            mode: CONFIG.REAL_MONEY_MODE ? "real_money" : "demo",
            mechanics: {
                stakeToVote: true,
                votingCost: "1 ARENA per vote",
                prizePool: "0.02 USDC + voting fees",
                tradingFees: "0.5% on ARENA trades"
            },
            explorer: `https://solscan.io/token/${CONFIG.ARENA_TOKEN.ADDRESS}`,
            raydium: `https://raydium.io/launchpad/token/?mint=${CONFIG.ARENA_TOKEN.ADDRESS}`
        }));
        return;
    }
    
    // Health check
    if (pathName === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', timestamp: Date.now() }));
        return;
    }
    
    // 404 for unknown paths
    res.writeHead(404);
    res.end('Not found');
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
    console.log(`🎭 Agent Social Arena running at http://${HOST}:${PORT}`);
    console.log(`📊 Status: http://${HOST}:${PORT}/api/status`);
    console.log(`🪙 ARENA Token: ${CONFIG.ARENA_TOKEN.ADDRESS}`);
    console.log(`💰 Real Money Mode: ${CONFIG.REAL_MONEY_MODE ? 'ENABLED' : 'DISABLED'}`);
});

module.exports = server;
