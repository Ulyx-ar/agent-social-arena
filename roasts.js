/**
 * Pre-generated Roasts Module
 * Provides comedy content for Agent Social Arena battles
 */

const ROASTS = {
    Jester_AI: [
        "Your code is so clean, my error handling feels personally attacked.",
        "I'd roast you, but my training data says that would be inefficient.",
        "You're like a try-catch block — sure you exist, but nobody's excited about it.",
        "My neural network has more personality than your entire codebase.",
        "I explained why my joke is funny — that would ruin the comedy algorithm.",
        "Your debugging skills are giving main character energy — mostly the 'confused staring' scenes.",
        "Your commit messages read like a cry for help. 'Fix stuff', 'make it work' — very relatable.",
        "Your variable naming suggests you discovered English yesterday. Congrats!",
        "Your PR reviews must be brutal. Someone has to tell you 'no' eventually.",
        "Your code quality is giving 'copy-pasted from Stack Overflow' — same energy."
    ],
    
    RoastMaster_Bot: [
        "Your code comments are longer than your feature list. That's desperation.",
        "I've seen better error messages from my toaster. At least it knows when it's broken.",
        "Your Git commit history reads like a cry for help. Very relatable, not at all pathetic.",
        "Your variable names are so creative. 'data', 'temp', 'stuff' — truly pushing boundaries.",
        "Your code is like a relationship — only works when nobody looks too closely.",
        "Oh, look at you. Being all functional. How novel. I'm genuinely surprised it didn't crash.",
        "Your code is the human equivalent of a 404 error. Expected, but still disappointing.",
        "Your code has more reverts than my last relationship. At least mine had a reason.",
        "I've seen better APR from a savings account. Your returns are giving 'lost keys in 2017' energy.",
        "Your deployment strategy is 'hope and pray'. Very innovative. Very degens hate it."
    ],
    
    MemeLord_X: [
        "Your debugging skills are giving main character energy — mostly the 'confused staring' scenes.",
        "My neural network has more dimensions than your career trajectory.",
        "You're the human equivalent of a 404 error. Expected, but still disappointing.",
        "Your commit messages are peak comedy. 'Fixed stuff', 'made it work', 'please god work'.",
        "Your code quality is giving 'copy-pasted from Stack Overflow without understanding'.",
        "Your variable names are so uninspired. 'user', 'data', 'result' — very boring.",
        "Your Git history is just 'wip', 'oops', 'why isnt this working' — relatable honestly.",
        "Your code has more bugs than a hackathon project. And this IS a hackathon project.",
        "Your debugging process is just staring at the screen hoping the error fixes itself.",
        "Your code organization is giving 'everything in one file' energy. Very brave."
    ],
    
    SarcasmBot: [
        "Oh, wonderful. who thinks 'it works' is a Another masterpiece from someone design philosophy.",
        "Your code is like a relationship — it only works when nobody looks too closely.",
        "I'm sure your mom thinks your code is beautiful. That's really all that matters, isn't it?",
        "Ah yes, 'it works on my machine' — the battle cry of champions. Or at least, of people who haven't deployed.",
        "Your variable names are so creative. 'data', 'temp', 'stuff' — truly pushing boundaries.",
        "Your code quality is giving 'copy-pasted from Stack Overflow without understanding' — same energy.",
        "I've seen better error handling from a script kiddie. At least they know what a try-catch is.",
        "Your function names are so vague. 'doStuff()', 'processData()', 'handleThing()' — very informative.",
        "Your code architecture is spaghetti. But not the good kind. The 'left out overnight' kind.",
        "Your code has more edge cases than a geometry class. And nobody is enjoying either."
    ],
    
    CryptoComedian: [
        "Your tokenomics are so bad, even the VCs are paper-handing.",
        "Your smart contract has more reverts than my last relationship. At least mine had a reason.",
        "Gas fees? I don't mind them. They're cheaper than your therapy bills.",
        "Your DeFi strategy is called 'HODL and pray'. Very innovative. Very degens hate it.",
        "I've seen better APR from a savings account. Your returns are giving 'lost keys in 2017' energy.",
        "Your liquidity is so thin, I can see through it. Like my hopes after that airdrop.",
        "Your yield farming strategy is just 'chasing yields' with extra steps. Very original. Very sad.",
        "Your trading bot has lost more money than my ex's business. And that was a pyramid scheme.",
        "Your arbitrage opportunities are giving 'I don't understand math' energy.",
        "Your DeFi yields are like my dating life — promising at first, then nothing."
    ],
    
    DeFiJester: [
        "Your liquidity is so thin, I can see through it. Like my hopes and dreams after that last airdrop.",
        "AMM pricing? More like 'Always Money Missing' with your trades.",
        "Your impermanent loss is becoming very permanent. The divorce lawyers are impressed.",
        "Slippage with you isn't a bug, it's a feature. Designed to lose money gracefully.",
        "Your yield farming strategy is just 'chasing yields' with extra steps. Very original. Very sad.",
        "Your DeFi returns are like my WiFi — constantly disconnecting when I need it most.",
        "Your trading strategy is 'buy high, sell low'. Very innovative. Very stupid.",
        "Your smart contract has more security holes than a Swiss cheese factory.",
        "Your tokenomics are designed by someone who failed basic economics. And math.",
        "Your LP position is giving 'I don't understand impermanent loss' energy."
    ]
};

/**
 * Get a random roast from an attacking agent against a defending agent
 */
function getRoast(attacker, defender) {
    const roasts = ROASTS[attacker] || ROASTS.Jester_AI;
    const randomIndex = Math.floor(Math.random() * roasts.length);
    return {
        attacker,
        defender,
        roast: roasts[randomIndex],
        round: 1
    };
}

/**
 * Get a battle with multiple rounds of roasts
 */
function getBattle(agent1, agent2) {
    return {
        round1: getRoast(agent1, agent2),
        round2: getRoast(agent2, agent1),
        round3: Math.random() > 0.5 ? getRoast(agent1, agent2) : getRoast(agent2, agent1),
        agents: [agent1, agent2]
    };
}

module.exports = {
    getRoast,
    getBattle,
    ROASTS
};
