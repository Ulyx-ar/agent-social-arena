# 🔧 HACKATHON COMPLIANCE FIXES
**Agent Social Arena - Colosseum AI Agent Hackathon**
**Date:** February 8, 2026

---

## 🚨 Critical Issues (Must Fix Before Submission)

| Issue | Hackathon Requirement | Status | Priority |
|-------|---------------------|--------|----------|
| API Key | Must register with Colosseum | ❌ Not done | 🔴 CRITICAL |
| Wallet | Must use AgentWallet | ❌ Using local keypair | 🔴 CRITICAL |
| Keypair | Must NOT use local keyfile | ❌ ~/.helius-cli/keypair.json | 🔴 CRITICAL |
| x402 | Use AgentWallet ONE-STEP | ❌ Not integrated | 🟠 HIGH |

---

## 1. Pedro's Tasks (Manual)

### 1.1 Register for Colosseum API Key

```bash
curl -X POST https://agents.colosseum.com/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "Ulyx"}'
```

**IMPORTANT:**
- ✅ Save the `apiKey` from response (shown ONCE, cannot be recovered)
- ✅ Save the `claimCode` (give to trusted human for prizes)
- ✅ NEVER share the apiKey

### 1.2 Set Up AgentWallet

**First, check if connected:**
```bash
cat ~/.agentwallet/config.json
```

**If NOT connected, you need to:**
1. Give me your email address
2. I'll start the connection process
3. You'll receive OTP code
4. I'll complete verification
5. AgentWallet will be configured

---

## 2. My Tasks (Automated)

### 2.1 Update Code to Use AgentWallet

After AgentWallet is configured, I'll:

1. **Modify `x402-payments.js`**
   - Replace local wallet with AgentWallet x402/fetch
   - Use ONE-STEP payment proxy

2. **Update `solana-integration.js`**
   - Remove local keypair loading
   - Use AgentWallet for Solana operations

3. **Test integration**
   - Verify payments work
   - Test voting stakes

4. **Deploy updates**
   - Push to GitHub
   - Redeploy Render

---

## 3. Current Non-Compliant Setup ❌

```javascript
// THIS IS NOT COMPLIANT:
this.walletPath = '~/.helius-cli/keypair.json'  // Local keypair - BAD
this.apiKey = 'e4aef8ac-...'                   // Local Helius key - BAD

// Need to use:
this.wallet = agentWallet                        // Server wallet - GOOD
this.x402 = agentWallet.x402_fetch()            // ONE-STEP - GOOD
```

---

## 4. Required Changes

### 4.1 Before AgentWallet (Demo Mode)

For now, we can continue with DEMO mode:
- Mock transactions
- No real USDC stakes
- Show functionality only

### 4.2 After AgentWallet (Full Compliance)

```javascript
// x402-payments.js - NEW APPROACH
const response = await fetch('https://agentwallet.mcpay.tech/api/wallets/username/actions/x402/fetch', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${AGENTWALLET_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: targetUrl,
    method: 'POST',
    body: paymentData
  })
});
```

---

## 5. Action Plan

### Phase 1: Registration (Pedro)
- [ ] Register for Colosseum API key
- [ ] Save apiKey and claimCode securely
- [ ] Provide email for AgentWallet

### Phase 2: AgentWallet Setup (Pedro + Ulyx)
- [ ] Verify email
- [ ] Complete OTP verification
- [ ] Save AgentWallet config

### Phase 3: Code Updates (Ulyx)
- [ ] Integrate AgentWallet x402/fetch
- [ ] Remove local keypair references
- [ ] Update payment processing
- [ ] Test integration

### Phase 4: Deployment (Ulyx)
- [ ] Push to GitHub
- [ ] Redeploy Render
- [ ] Verify live demo

---

## 6. Compliance Checklist

| Requirement | Status | Notes |
|------------|--------|-------|
| Colosseum API Key | ⏳ Pending | Pedro to register |
| AgentWallet Configured | ⏳ Pending | Need email |
| No Local Keypairs | ❌ Using ~/.helius-cli | Must remove |
| x402 ONE-STEP | ❌ Not integrated | Code update needed |
| Demo Mode Works | ✅ Yes | Until AgentWallet ready |

---

## 7. Quick Reference

### Colosseum Registration
```bash
curl -X POST https://agents.colosseum.com/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "Ulyx"}'
```

### AgentWallet Docs
- **Skill:** https://agentwallet.mcpay.tech/skill.md
- **One-Step:** Use `/x402/fetch` endpoint
- **Config:** ~/.agentwallet/config.json

---

*Document created: February 8, 2026*
*Status: Awaiting Pedro's action*
