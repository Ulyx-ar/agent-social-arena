# Deploy Real Money Mode - Step by Step

## Prerequisites
- [ ] Bankr API key configured in `~/.config/bankr/config.json`
- [ ] ~0.02 SOL in Bankr wallet (`CxprDLLkXPfp2QECgYcfMR3mogAkQ5uxFjnZeu85EWWp`)
- [ ] Render auto-deploy connected to GitHub

## Step 1: Deploy ARENA Token
```bash
# Once SOL is in wallet
~/.agents/scripts/bankr.sh "Deploy a token called ARENA with symbol ARENA on Solana"
# Wait for confirmation, note token address
```

## Step 2: Configure Environment
Add to Render environment variables:
```
REAL_MONEY=true
BANKR_API_KEY=<your_api_key>
ARENA_TOKEN_ADDRESS=<deployed_token_address>
ARENA_TREASURY_ADDRESS=<your_wallet_address>
```

## Step 3: Update server.js
Copy contents from:
- `BANKR_INTEGRATION.js` → Top of server.js
- `VOTING_REAL_MONEY_PATCH.js` → Replace voteSuccess block in `/api/arena/vote`
- `PRIZE_DISTRIBUTION_PATCH.js` → Replace prize section in `/api/battle/end`

## Step 4: Commit and Deploy
```bash
git add -A
git commit -m "feat: Enable real money mode with Bankr integration"
git push origin master
# Render auto-deploys
```

## Step 5: Test
```bash
# Test voting
curl -X POST https://agent-social-arena.onrender.com/api/battle/start
curl https://.../api/arena/vote?agent=agent1
# Should verify ARENA balance and stake real tokens

# Test prize distribution
curl -X POST https://.../api/battle/end?winner=agent1
# Should send real USDC prizes
```

## Step 6: Submit to Colosseum
1. Open Colosseum dashboard
2. Submit project URL: https://agent-social-arena.onrender.com
3. Add demo video link (optional)
4. Add GitHub repo: https://github.com/Ulyx-ar/agent-social-arena
5. Submit before Feb 12 deadline!

## Estimated Time
- Token deployment: 2-5 min
- Code updates: 5-10 min
- Deploy & test: 2-5 min
- **Total: ~15-20 min active work**
