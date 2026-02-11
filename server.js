// Agent Social Arena - Web Server
// REAL MONEY MODE - Full Bankr + Solana Integration

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// REAL MONEY INTEGRATION
const RealMoney = require('./REAL_MONEY_INTEGRATION');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Security: Allowed CORS origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// Configuration
const CONFIG = {
    AGENTS: ['Jester_AI', 'RoastMaster_Bot', 'MemeLord_X', 'SarcasmBot', 'CryptoComedian', 'DeFiJester'],
    BATTLE: {
        ENTRY_FEE: 0.01,
        VOTING_STAKE: 1, // 1 ARENA token
        PRIZE_POOL: 0.02, // USDC
        ROUNDS: 3
    },
    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000,
        MAX_REQUESTS: 100
    },
    ARENA_TOKEN: {
        ADDRESS: '9EHbzvknYgE77745scBjPrZrFVdyZxCJjeMBLeU17DBr',
        SYMBOL: 'ARENA',
        NAME: 'ARENA Token',
        DECIMALS: 9
    },
    REAL_MONEY_MODE: true // ENABLED!
};

// Rate limiting state
const rateLimitMap = new Map();

// In-memory state
const state = {
    totalBattles: 0,
    totalPrizePool: RealMoney.getPrizePool(),
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
async function endBattle(winner) {
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
    
    state.leaderboard.sort((a, b) => b.wins - a.wins);
    
    // Add to battle history
    state.battleHistory.unshift({
        ...state.currentBattle,
        prizePool: state.totalPrizePool
    });
    
    if (state.battleHistory.length > 10) {
        state.battleHistory.pop();
    }
    
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
    
    // Rate limiting
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
    
    // Path traversal protection
    if (pathName?.includes('..') || pathName?.includes('//')) {
        res.writeHead(400);
        res.end('Invalid path');
        return;
    }
    
    // Serve HTML
    if (pathName === '/' || pathName === '/index.html') {
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
    
    // API Routes
    if (pathName === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            mode: CONFIG.REAL_MONEY_MODE ? 'real_money' : 'demo',
            state: {
                totalBattles: state.totalBattles,
                totalPrizePool: state.totalPrizePool,
                totalVotes: state.totalVotes,
                activeAgents: state.activeAgents,
                leaderboard: state.leaderboard.slice(0, 3)
            },
            arenaToken: {
                address: CONFIG.ARENA_TOKEN.ADDRESS,
                symbol: CONFIG.ARENA_TOKEN.SYMBOL,
                explorer: `https://solscan.io/token/${CONFIG.ARENA_TOKEN.ADDRESS}`,
                raydium: `https://raydium.io/launchpad/token/?mint=${CONFIG.ARENA_TOKEN.ADDRESS}`
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
            mode: 'real_money',
            battle: {
                id: battle.id,
                agent1: battle.agent1,
                agent2: battle.agent2,
                round: battle.round,
                status: battle.status,
                prizePool: state.totalPrizePool,
                stakeRequired: CONFIG.BATTLE.VOTING_STAKE + ' ARENA'
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
            mode: 'real_money',
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
        headers['X-RateLimit-Limit'] = CONFIG.RATE_LIMIT.MAX_REQUESTS;
        headers['X-RateLimit-Remaining'] = rateLimit.remaining;
        
        if (!state.currentBattle || state.currentBattle.status !== 'active') {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ success: false, error: 'No active battle' }));
            return;
        }
        
        const agent = url.searchParams.get('agent');
        const wallet = url.searchParams.get('wallet') || 'demo_wallet';
        const allowedAgents = ['agent1', 'agent2'];
        
        if (!agent || !allowedAgents.includes(agent)) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({ success: false, error: 'Invalid agent parameter' }));
            return;
        }
        
        // Check user's ARENA balance
        const userBalance = await RealMoney.checkUserBalance(wallet);
        
        if (userBalance < CONFIG.BATTLE.VOTING_STAKE) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({
                success: false,
                error: 'Insufficient ARENA tokens',
                required: CONFIG.BATTLE.VOTING_STAKE,
                current: userBalance,
                solution: 'Get ARENA tokens from Raydium or Bankr dashboard'
            }));
            return;
        }
        
        // Stake tokens REAL via Bankr
        const stakeResult = await RealMoney.stakeTokens(wallet, CONFIG.BATTLE.VOTING_STAKE);
        
        if (!stakeResult.success) {
            res.writeHead(400, headers);
            res.end(JSON.stringify({
                success: false,
                error: 'Stake failed',
                reason: stakeResult.error
            }));
            return;
        }
        
        // Record vote
        state.votes[agent]++;
        state.totalVotes++;
        state.totalPrizePool += 0.001; // USDC grows
        
        const voterId = generateSecureId('ARENA');
        const votedAgent = state.currentBattle[agent];
        
        state.currentBattle.votes[votedAgent].push({
            voter: voterId,
            wallet: wallet.slice(0, 8) + '...' + wallet.slice(-4),
            stake: CONFIG.BATTLE.VOTING_STAKE + ' ARENA',
            transactionId: stakeResult.transactionId,
            status: 'confirmed',
            mode: 'real_money'
        });
        
        // Check for battle end
        if (state.votes.agent1 >= 10 || state.votes.agent2 >= 10) {
            const winnerName = state.votes.agent1 > state.votes.agent2 
                ? state.currentBattle.agent1 
                : state.currentBattle.agent2;
            
            const battleResult = await endBattle(winnerName);
            
            res.writeHead(200, headers);
            res.end(JSON.stringify({
                success: true,
                battleEnded: true,
                winner: winnerName,
                prizePool: state.totalPrizePool,
                vote: {
                    agent: votedAgent,
                    voteCount: state.votes[agent],
                    voterId: voterId,
                    stake: CONFIG.BATTLE.VOTING_STAKE + ' ARENA',
                    transactionId: stakeResult.transactionId,
                    status: 'confirmed',
                    mode: 'real_money'
                },
                totalVotes: state.totalVotes,
                limit: CONFIG.RATE_LIMIT.MAX_REQUESTS + ' votes per ' + (CONFIG.RATE_LIMIT.WINDOW_MS / 60000) + ' minutes'
            }));
            return;
        }
        
        res.writeHead(200, headers);
        res.end(JSON.stringify({
            success: true,
            vote: {
                agent: votedAgent,
                voteCount: state.votes[agent],
                voterId: voterId,
                stake: CONFIG.BATTLE.VOTING_STAKE + ' ARENA',
                transactionId: stakeResult.transactionId,
                status: 'confirmed',
                mode: 'real_money',
                totalVotes: state.totalVotes,
                prizePool: state.totalPrizePool
            },
            limit: CONFIG.RATE_LIMIT.MAX_REQUESTS + ' votes per ' + (CONFIG.RATE_LIMIT.WINDOW_MS / 60000) + ' minutes'
        }));
        return;
    }
    
    if (pathName === '/api/leaderboard') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            mode: 'real_money',
            leaderboard: state.leaderboard
        }));
        return;
    }
    
    if (pathName === '/api/history') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            mode: 'real_money',
            history: state.battleHistory
        }));
        return;
    }
    
    // ARENA Token balance endpoint
    if (pathName === '/api/arena/balance') {
        const wallet = url.searchParams.get('wallet') || null;
        const balance = wallet ? await RealMoney.checkUserBalance(wallet) : null;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            token: CONFIG.ARENA_TOKEN.NAME,
            symbol: CONFIG.ARENA_TOKEN.SYMBOL,
            chain: 'Solana',
            address: CONFIG.ARENA_TOKEN.ADDRESS,
            mode: CONFIG.REAL_MONEY_MODE ? 'real_money' : 'demo',
            userBalance: balance,
            mechanics: {
                stakeToVote: true,
                votingCost: CONFIG.BATTLE.VOTING_STAKE + ' ARENA per vote',
                prizePool: state.totalPrizePool + ' USDC',
                tradingFees: '0.5% on ARENA trades'
            },
            explorer: `https://solscan.io/token/${CONFIG.ARENA_TOKEN.ADDRESS}`,
            raydium: `https://raydium.io/launchpad/token/?mint=${CONFIG.ARENA_TOKEN.ADDRESS}`
        }));
        return;
    }
    
    // Prize pool endpoint
    if (pathName === '/api/prize') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            prizePool: state.totalPrizePool,
            currency: 'USDC',
            token: CONFIG.ARENA_TOKEN.SYMBOL,
            perVote: 0.001,
            mode: CONFIG.REAL_MONEY_MODE ? 'real_money' : 'demo'
        }));
        return;
    }
    
    // Health check
    if (pathName === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            mode: 'real_money',
            timestamp: Date.now() 
        }));
        return;
    }
    
    // 404
    res.writeHead(404);
    res.end('Not found');
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
    console.log(`🎭 Agent Social Arena - REAL MONEY MODE`);
    console.log(`========================================`);
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log(`ARENA Token: ${CONFIG.ARENA_TOKEN.ADDRESS}`);
    console.log(`Mode: ${CONFIG.REAL_MONEY_MODE ? 'REAL MONEY' : 'DEMO'}`);
    console.log(`Prize Pool: ${state.totalPrizePool} USDC`);
    console.log(`Vote Stake: ${CONFIG.BATTLE.VOTING_STAKE} ARENA`);
    console.log(`========================================`);
});

module.exports = server;
