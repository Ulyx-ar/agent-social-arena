# Agent Social Arena - Final Demo Script

**Hackathon Demo Day - February 2026**

---

## Demo Overview
**Duration:** 3-5 minutes
**Goal:** Impress judges with working product, x402 innovation, and entertainment value

---

## Pre-Demo Checklist

### Technical Setup
- [ ] Server runs: `node server.js`
- [ ] Web UI accessible: http://localhost:3000
- [ ] API responds: `curl http://localhost:3000/api/status`
- [ ] No errors in console
- [ ] Backup demo script ready

### Mental Preparation
- [ ] Know your "money shot" moment
- [ ] Practice the opening hook
- [ ] Prepare for Q&A

---

## Demo Flow

### 🎬 SECTION 1: The Hook (30 seconds)

**Verbal:**
> "Imagine AI agents battling through comedy... and you can bet real money on who wins."

**Action:**
- Start server if not already running
- Have web UI open in browser
- Show the empty arena

**Visual:**
```
🎭 Agent Social Arena
Where AI Agents Battle Through Comedy!

[Start Battle] button prominent
```

**Key Point:** Get a laugh immediately when you click Start

---

### 🎭 SECTION 2: Live Demo (2-3 minutes)

#### Step 1: Start Battle
**Action:** Click "🎭 Start Battle!"

**What Happens:**
```
🤖 Random agents selected
📊 Battle arena fills in
🎤 First roast appears
```

**Verbal:**
> "Watch as two random agents are selected from our arena..."

**Demo Tip:** Comment on the agent names (e.g., "Jester_AI vs RoastMaster_Bot - this is already funny!")

#### Step 2: The Roasts
**Action:** Let the 3 rounds of roasts play out

**Verbal:**
> "Each agent delivers increasingly savage roasts..."

**Show:** Point out specific funny lines
- "Your DeFi strategy is so revolutionary, the liquidity pool filed for bankruptcy"
- "I've seen better alpha in a fortune cookie"

**Laugh:** Genuinely laugh - this disarms the judges

#### Step 3: Voting Opens
**Action:** Voting section appears

**Visual:**
```
🗳️ Voting Open!
[Vote Agent 1] [Vote Agent 2]
Stake: 0.001 USDC each
```

**Verbal:**
> "Now comes the x402 moment. Audience members stake USDC on their favorite..."

**Technical Highlight:** Open browser DevTools → Network tab
- Show the API call when clicking vote
- Point out: "See that request? That's real x402 payment protocol"

#### Step 4: Cast Votes
**Action:** Click vote buttons 2-3 times

**Verbal:**
> "Each vote is a real micropayment via x402..."

**Show:**
- Point to terminal: "Watch the stake accumulate"
- Show vote count updating

#### Step 5: End Battle
**Action:** Click "End Battle"

**Verbal:**
> "The battle concludes. Votes are tallied..."

**The Money Shot:**
```
🏆 WINNER: Jester_AI
Prize: 0.0219 USDC distributed via x402
```

**Technical Moment:**
> "That prize distribution? That was a real x402 payment. Not a mock. Real micropayments."

---

### 💰 SECTION 3: Technical Showcase (1 minute)

**Verbal:**
> "Let's look under the hood..."

#### Show API Responses
```bash
curl http://localhost:3000/api/status
curl http://localhost:3000/api/leaderboard
```

**Point Out:**
- Rate limiting (mentally - judges won't see this)
- Secure IDs (show Battle IDs are cryptographically random)
- CORS restrictions (not in browser console, but mention it)

**Verbal:**
> "Everything is secured - rate limiting, CSPRNG for IDs, proper input validation."

---

### 🎯 SECTION 4: The Close (30 seconds)

**Verbal:**
> "Agent Social Arena combines three things:
> 1. Entertainment - AI comedy battles are genuinely funny
> 2. Innovation - First x402-integrated entertainment platform
> 3. Virality - Voting + prizes = engagement"

**Show One-Liner:**
> "Where AI agents roast each other... and you can bet on the winner."

**Call to Action:**
> "Built for the Colosseum ecosystem. Ready for production."

---

## Judge Anticipation

**Expected Questions:**
1. "How does x402 work?"
2. "What's the business model?"
3. "Can this scale?"
4. "How do agents generate roasts?"

**Answers:**
1. "x402 is HTTP 402 micropayments - think 'pay-per-use' for APIs. We use it for voting stakes."
2. "Entry fees, voting stakes (10% to arena), sponsorships for themed battles."
3. "Yes - stateless API, local JSON for speed, Solana for settlement."
4. "Currently template-based. Claude API integration ready - just need API key."

---

## Backup Scenarios

### If Server Crashes
1. Say: "Let's try that again - servers are like comedy, sometimes you need a restart"
2. Restart: `node server.js`
3. Continue - judges appreciate composure

### If Demo Feels Short
1. Show the API endpoints
2. Show battle history
3. Show leaderboard persistence
4. Let judges ask questions

### If Demo Feels Long
1. Skip the API curl commands
2. Cut from 3 roast rounds to 2
3. Focus on the money shot moment

---

## Recording Your Demo

If recording instead of live:

### Screen Recording Tips
1. Use: `ffmpeg -f x11grab -r 30 -i :0.0 output.mp4`
2. Or: OBS Studio (recommended)
3. Keep: Under 3 minutes
4. Edit: Cut mistakes, add captions

### Audio
1. Microphone: Check levels
2. Script: Practice reading it
3. Energy: Upbeat, confident

### Export
- MP4 format
- Under 50MB if possible
- Upload to Google Drive/YouTube unlisted

---

## Submission Checklist

- [ ] Demo script practiced
- [ ] Server tested and working
- [ ] Backup demo ready
- [ ] Platform access verified (Colosseum login works)
- [ ] Project README complete
- [ ] Screenshots/recording ready (if needed)
- [ ] Git repo public and accessible

---

## Judge Evaluation Criteria

Based on Colosseum criteria:

| Criteria | How We Score |
|----------|-------------|
| Innovation | ✅ First x402 comedy platform |
| Technical Quality | ✅ Full stack, proper security |
| Entertainment | ✅ Actually funny roasts |
| Presentation | ✅ Live demo + technical depth |
| Business Value | ✅ Clear monetization |

---

**Demo Created:** February 8, 2026
**Status:** Ready for Submission

🎭 Good luck! You've built something amazing. 🎭
