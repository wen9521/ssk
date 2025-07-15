// frontend/src/gameLogic/gameManager.js
import { createDeck, shuffleDeck, dealDoudizhu, dealBigTwo, dealThirteenWater, sortCards } from './cardUtils';
import * as doudizhu from './doudizhu';
import * as bigTwo from './bigTwo';
import * as thirteenWater from './thirteenWater';
import { calcSSSAllScores, isFoul } from './sssScoreLogic'; // Corrected import path, now including isFoul

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
// Omitted for brevity, no changes here


// --- Action Handlers ---
const handleDoudizhuAction = (state, action) => {
    // Omitted for brevity, no changes here
    return state;
};

const handleBigTwoAction = (state, action) => {
    // Omitted for brevity, no changes here
    return state;
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
        
        // Now correctly use the imported isFoul function
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
