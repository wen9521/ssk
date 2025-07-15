// frontend/src/gameLogic/gameManager.js
import { createDeck, shuffleDeck, dealDoudizhu, dealBigTwo, dealThirteenWater, sortCards } from './cardUtils';
import * as doudizhu from './doudizhu';
import * as bigTwo from './bigTwo';
import * as thirteenWater from './thirteenWater';
import { calcSSSAllScores } from './sssScoreLogic'; // Import the scoring logic from its new location

// --- Initializers (Doudizhu part is complete, others are basic) ---
const initializeDoudizhu = () => {
    const deck = shuffleDeck(createDeck());
    const { hands, landlordCards } = dealDoudizhu(deck);
    return {
        gameType: 'doudizhu',
        players: [
            { id: 0, name: '玩家', hand: sortCards(hands[0], 'doudizhu') },
            { id: 1, name: 'AI 右', hand: sortCards(hands[1], 'doudizhu'), isAI: true },
            { id: 2, name: 'AI 左', hand: sortCards(hands[2], 'doudizhu'), isAI: true },
        ],
        landlord: null, landlordBid: 0, landlordCards: landlordCards,
        currentPlayer: 0, lastPlayerToBid: -1, bids: [-1,-1,-1],
        lastPlayedHand: null, lastPlayer: null, turnHistory: [],
        gamePhase: 'bidding', winner: null,
    };
};

const initializeBigTwo = () => {
    const deck = shuffleDeck(createDeck());
    const { hands } = dealBigTwo(deck);
    let startingPlayer = hands.findIndex(h => h.includes('D3'));
    if (startingPlayer === -1) { // Fallback if D3 somehow isn't dealt
        startingPlayer = 0;
    }
    return {
        gameType: 'big_two',
        players: [
            { id: 0, name: '玩家', hand: sortCards(hands[0], 'big_two') },
            { id: 1, name: 'AI 1', hand: sortCards(hands[1], 'big_two'), isAI: true },
            { id: 2, name: 'AI 2', hand: sortCards(hands[2], 'big_two'), isAI: true },
            { id: 3, name: 'AI 3', hand: sortCards(hands[3], 'big_two'), isAI: true },
        ],
        currentPlayer: startingPlayer,
        lastPlayedHand: null,
        lastPlayer: null,
        gamePhase: 'playing',
        winner: null,
    };
}

const initializeThirteenWater = () => {
    const deck = shuffleDeck(createDeck());
    const { hands } = dealThirteenWater(deck);
    const players = [
        { id: 0, name: '玩家', hand: sortCards(hands[0], 'thirteen_water'), isAI: false, arrangement: null },
        ...[1,2,3].map(i => {
            const hand = sortCards(hands[i], 'thirteen_water');
            const arrangement = thirteenWater.autoArrangeCards(hand); // AI auto-arranges
            return {id: i, name: `AI ${i}`, hand: hand, isAI: true, arrangement: arrangement };
        })
    ];
    return {
        gameType: 'thirteen_water',
        players: players,
        gamePhase: 'arranging', // arranging, scoring
        scores: null
    };
}

export const initializeGame = (gameType) => {
    switch (gameType) {
        case 'doudizhu': return initializeDoudizhu();
        case 'big_two': return initializeBigTwo();
        case 'thirteen_water': return initializeThirteenWater();
        default: throw new Error('Unsupported game type');
    }
};


// --- AI Logic ---
const doudizhuAIThinkAndBid = (state) => {
    const player = state.players[state.currentPlayer];
    const hasRJ = player.hand.includes('RJ');
    const hasBJ = player.hand.includes('BJ');
    const numTwos = player.hand.filter(c => c.includes('2')).length;
    let bid = 0;
    if (state.landlordBid < 3 && (hasRJ || hasBJ) && numTwos > 1) bid = 3;
    else if (state.landlordBid < 2 && (hasRJ || hasBJ || numTwos > 1)) bid = 2;
    else if (state.landlordBid < 1 && (numTwos > 0 || hasBJ || hasRJ)) bid = 1;
    return { type: 'BID', payload: bid };
}

const doudizhuAIThinkAndPlay = (state) => {
    const player = state.players[state.currentPlayer];
    const { hand } = player;
    // Basic AI: find smallest valid hand
    for (const card of sortCards(hand, 'doudizhu').reverse()) {
        if (doudizhu.canPlay(doudizhu.getHandType([card]), state.lastPlayedHand)) return { type: 'PLAY', payload: [card] };
    }
    // TODO: Add logic for pairs, straights, etc.
    return { type: 'PASS' };
}

const bigTwoAIThinkAndPlay = (state) => {
    const player = state.players[state.currentPlayer];
    const { hand } = player;
    // Very simple AI for Big Two. Finds the first playable hand.
    // Tries singles first, then pairs etc. (A better AI would be more strategic)
    
    // Singles
    for (const card of sortCards(hand, 'big_two')) {
        if (bigTwo.canPlay([card], state.lastPlayedHand)) {
            return { type: 'PLAY', payload: [card] };
        }
    }
    // Pairs (Add more complex logic later)
    // ...
    return { type: 'PASS' };
}


// --- Action Handlers ---
const handleDoudizhuAction = (state, action) => {
    let newState = JSON.parse(JSON.stringify(state));
    if (newState.gamePhase === 'bidding') {
        const { payload: bid } = action;
        if(bid > newState.landlordBid) {
            newState.landlordBid = bid;
            newState.landlord = newState.currentPlayer;
        }
        newState.bids[newState.currentPlayer] = bid;
        const bidders = newState.bids.filter(b => b !== -1).length;
        const passes = newState.bids.filter(b => b === 0).length;
        if ((bidders === 3 && passes === 2) || bid === 3) {
            newState.gamePhase = 'playing';
            const landlord = newState.players.find(p => p.id === newState.landlord);
            landlord.hand = sortCards([...landlord.hand, ...newState.landlordCards], 'doudizhu');
            newState.currentPlayer = newState.landlord;
            return newState;
        }
    } else if (newState.gamePhase === 'playing') {
        if (action.type === 'PASS') { /* Pass */ } 
        else if (action.type === 'PLAY') {
            const { payload: cards } = action;
            const handType = doudizhu.getHandType(cards);
            if (handType.type === 'Invalid' || !doudizhu.canPlay(handType, newState.lastPlayedHand)) {
                throw new Error("Invalid hand.");
            }
            newState.players[newState.currentPlayer].hand = newState.players[newState.currentPlayer].hand.filter(c => !cards.includes(c));
            newState.lastPlayedHand = handType;
            newState.lastPlayer = newState.currentPlayer;
            if (newState.players[newState.currentPlayer].hand.length === 0) {
                newState.gamePhase = 'gameover';
                newState.winner = newState.currentPlayer;
                return newState;
            }
        }
        newState.currentPlayer = (newState.currentPlayer + 1) % 3;
        if(newState.currentPlayer === newState.lastPlayer) {
            newState.lastPlayedHand = null;
        }
    }
    if (newState.players[newState.currentPlayer].isAI && newState.gamePhase !== 'gameover') {
        const aiAction = newState.gamePhase === 'bidding' ? doudizhuAIThinkAndBid(newState) : doudizhuAIThinkAndPlay(newState);
        return handleDoudizhuAction(newState, aiAction);
    }
    return newState;
};

const handleBigTwoAction = (state, action) => {
    let newState = JSON.parse(JSON.stringify(state));
    if (action.type === 'PASS') { /* Pass */ } 
    else if (action.type === 'PLAY') {
        const { payload: cards } = action;
        // Special case for the first turn (must include Diamond 3)
        if (newState.lastPlayer === null && !cards.includes('D3')) {
            throw new Error("First play must include Diamond 3.");
        }
        if (!bigTwo.canPlay(cards, newState.lastPlayedHand)) {
            throw new Error("Invalid hand.");
        }
        newState.players[newState.currentPlayer].hand = newState.players[newState.currentPlayer].hand.filter(c => !cards.includes(c));
        newState.lastPlayedHand = bigTwo.getHandType(cards);
        newState.lastPlayer = newState.currentPlayer;
        if (newState.players[newState.currentPlayer].hand.length === 0) {
            newState.gamePhase = 'gameover';
            newState.winner = newState.currentPlayer;
            return newState;
        }
    }
    newState.currentPlayer = (newState.currentPlayer + 1) % 4;
    if (newState.currentPlayer === newState.lastPlayer) {
        newState.lastPlayedHand = null;
    }
    if (newState.players[newState.currentPlayer].isAI && newState.gamePhase !== 'gameover') {
        const aiAction = bigTwoAIThinkAndPlay(newState);
        return handleBigTwoAction(newState, aiAction);
    }
    return newState;
};

const handleThirteenWaterAction = (state, action) => {
    let newState = JSON.parse(JSON.stringify(state));
    
    if (action.type === 'SET_DUN' && state.gamePhase === 'arranging') {
        const { payload: arrangement } = action; // {front, middle, back}
        
        // This validation should be done in the UI layer before sending, but good to have it here too.
        if (arrangement.front.length !== 3 || arrangement.middle.length !== 5 || arrangement.back.length !== 5) {
             throw new Error("牌墩数量不正确！");
        }

        const player = newState.players.find(p => p.id === 0);
        player.arrangement = arrangement;
        
        const scoringData = newState.players.map(p => ({
            ...p,
            head: p.arrangement.front,
            middle: p.arrangement.middle,
            tail: p.arrangement.back,
        }));

        // Check for foul play (倒水) before calculating scores
        const playerFoul = thirteenWater.isFoul(scoringData[0].head, scoringData[0].middle, scoringData[0].tail);
        if (playerFoul) {
            // In a real game, you might want to handle this more gracefully than an error.
            // For now, we can throw an error to notify the user.
             throw new Error("倒水了！你的牌墩设置不符合规则。");
        }
        
        const finalScores = calcSSSAllScores(scoringData);
        
        newState.players.forEach((p, index) => {
            p.score = finalScores[index];
            p.isFoul = thirteenWater.isFoul(scoringData[index].head, scoringData[index].middle, scoringData[index].tail);
        });

        newState.scores = finalScores;
        newState.gamePhase = 'scoring';
        
        return newState;
    } else if (action.type === 'RESTART') {
        return initializeThirteenWater();
    }
    return state; 
}


export const handleAction = (currentState, action) => {
    switch (currentState.gameType) {
        case 'doudizhu':
            return handleDoudizhuAction(currentState, action);
        case 'big_two':
            return handleBigTwoAction(currentState, action);
        case 'thirteen_water':
            return handleThirteenWaterAction(currentState, action);
        default:
            throw new Error('Unsupported game state');
    }
};
