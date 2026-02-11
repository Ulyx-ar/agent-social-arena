# Real Money Integration - Code Changes Needed

## Overview
This document outlines changes needed to upgrade from demo mode to real money with Bankr.

## Changes Required

### 1. Voting - Check ARENA Balance Before Vote

**Current (Demo):**
```javascript
const voteSuccess = true; // Always succeeds
```

**Required (Real Money):**
```javascript
// Call Bankr to check ARENA balance
const balanceResult = await fetchBankrBalance();
if (balanceResult.arena_balance < 1) {
    return { success: false, error: 'Insufficient ARENA tokens' };
}
```

### 2. Prize Distribution - Send USDC via Bankr

**Current (Demo):**
```javascript
// Mock prize distribution
console.log('Prize would be distributed...');
```

**Required (Real Money):**
```javascript
// Send USDC via Bankr
const prizeResult = await sendUSDC_viaBankr(winnerAddress, prizeAmount);
return { success: true, txId: prizeResult.transactionId };
```

### 3. API Endpoints Needed

```
GET /api/bankr/arena-balance
  - Returns: { success: true, balance: 0 }
  
POST /api/bankr/send-prize
  - Params: winnerAddress, amount
  - Returns: { success: true, txId: "..." }
```

## Bankr API Integration

### Check ARENA Balance
```bash
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d '{"prompt": "What is my ARENA token balance on Solana?"}'
```

### Send USDC Prize
```bash
curl -X POST "https://api.bankr.bot/agent/prompt" \
  -H "X-API-Key: $BANKR_API_KEY" \
  -d '{"prompt": "Send ${prizeAmount} USDC to ${winnerAddress} on Solana"}'
```

## Deployment Steps

1. Fund wallet with ~0.02 SOL
2. Deploy ARENA token via Bankr
3. Update server.js with Bankr API calls
4. Test voting with real balance check
5. Test prize distribution with real USDC
6. Deploy to Render

## Estimated Time
- Token deployment: 2-5 min
- Code updates: 15-20 min
- Testing: 10-15 min
- **Total: ~30-45 min**
