// frontend/src/gameLogic/gameManager.js
import { createDeck, shuffleDeck, dealDoudizhu, dealBigTwo, dealThirteenWater, sortCards } from './cardUtils';
import { canPlay as doudizhuCanPlay, getHandType as doudizhuGetHandType } from './doudizhu';
import { canPlay as bigTwoCanPlay, getHandType as bigTwoGetHandType } from './bigTwo';
import * as thirteenWater from './thirteenWater';
import { calcSSSAllScores, isFoul } from './sssScoreLogic';

// --- Initializers ---
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
        landlord: null, landlordBid: 0, landlordCards,
        currentPlayer: 0, lastPlayerToBid: -1, bids: [-1, -1, -1],
        lastPlayedHand: null, lastPlayer: null, turnHistory: [],
        gamePhase: 'bidding', winner: null,
    };
};

const initializeBigTwo = () => {
    const deck = shuffleDeck(createDeck());
    const { hands } = dealBigTwo(deck);
    let startingPlayer = hands.findIndex(h => h.includes('D3'));
    if (startingPlayer === -1) startingPlayer = 0;
    return {
        gameType: 'big_two',
        players: [
            { id: 0, name: '玩家', hand: sortCards(hands[0], 'big_two') },
            { id: 1, name: 'AI 1', hand: sortCards(hands[1], 'big_two'), isAI: true },
            { id: 2, name: 'AI 2', hand: sortCards(hands[2], 'big_two'), isAI: true },
            { id: 3, name: 'AI 3', hand: sortCards(hands[3], 'big_two'), isAI: true },
        ],
        currentPlayer: startingPlayer,
        lastPlayedHand: null, lastPlayer: null,
        gamePhase: 'playing', winner: null,
    };
};

const initializeThirteenWater = () => {
    const deck = shuffleDeck(createDeck());
    const { hands } = dealThirteenWater(deck);
    return {
        gameType: 'thirteen_water',
        players: [
            { id: 0, name: '玩家', hand: sortCards(hands[0], 'thirteen_water'), isAI: false, arrangement: null },
            ...[1, 2, 3].map(i => ({
                id: i, name: `AI ${i}`, isAI: true,
                hand: sortCards(hands[i], 'thirteen_water'),
                arrangement: thirteenWater.autoArrangeCards(sortCards(hands[i], 'thirteen_water'))
            }))
        ],
        gamePhase: 'arranging', scores: null
    };
};

export const initializeGame = (gameType) => {
    const initializers = {
        'doudizhu': initializeDoudizhu,
        'big_two': initializeBigTwo,
        'thirteen_water': initializeThirteenWater,
    };
    return initializers[gameType] ? initializers[gameType]() : new Error('Unsupported game type');
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
    for (const card of sortCards(hand, 'doudizhu').reverse()) {
        if (doudizhuCanPlay(doudizhuGetHandType([card]), state.lastPlayedHand)) return { type: 'PLAY', payload: [card] };
    }
    return { type: 'PASS' };
}

const bigTwoAIThinkAndPlay = (state) => {
    const player = state.players[state.currentPlayer];
    const { hand } = player;
    for (const card of sortCards(hand, 'big_two')) {
        if (bigTwoCanPlay([card], state.lastPlayedHand)) {
            return { type: 'PLAY', payload: [card] };
        }
    }
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
            const handType = doudizhuGetHandType(cards);
            if (handType.type === 'Invalid' || !doudizhuCanPlay(handType, newState.lastPlayedHand)) {
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
        if (newState.lastPlayer === null && !cards.includes('D3')) {
            throw new Error("First play must include Diamond 3.");
        }
        if (!bigTwoCanPlay(cards, newState.lastPlayedHand)) {
            throw new Error("Invalid hand.");
        }
        newState.players[newState.currentPlayer].hand = newState.players[newState.currentPlayer].hand.filter(c => !cards.includes(c));
        newState.lastPlayedHand = bigTwoGetHandType(cards);
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

    if (action.type === 'RESTART') {
        return initializeThirteenWater();
    }
    
    if (action.type === 'SET_DUN' && state.gamePhase === 'arranging') {
        const { payload: arrangement } = action;
        
        if (arrangement.front.length !== 3 || arrangement.middle.length !== 5 || arrangement.back.length !== 5) {
             throw new Error("牌墩数量不正确！");
        }
        
        if (isFoul(arrangement.front, arrangement.middle, arrangement.back)) {
            throw new Error("倒水了！你的牌墩设置不符合规则。");
        }

        const player = newState.players.find(p => p.id === 0);
        player.arrangement = arrangement;
        
        const scoringData = newState.players.map(p => ({
            ...p,
            head: p.arrangement.front,
            middle: p.arrangement.middle,
            tail: p.arrangement.back,
        }));
        
        const { playerInfos, scores } = calcSSSAllScores(scoringData);
        
        newState.players = playerInfos; 
        newState.scores = scores;
        newState.gamePhase = 'scoring';
        
        return newState;
    }
    return state; 
}


export const handleAction = (currentState, action) => {
    const handlers = {
        'doudizhu': handleDoudizhuAction,
        'big_two': handleBigTwoAction,
        'thirteen_water': handleThirteenWaterAction,
    };
    const handler = handlers[currentState.gameType];
    if (handler) {
        return handler(currentState, action);
    }
    throw new Error('Unsupported game state');
};
