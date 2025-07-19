import { createDeck, shuffle } from './deck.js';
import { parseCardType, canPlayOver } from './card-logic.js';

export class DouDizhuGame {
    constructor(playerNames = ['您', '右侧AI', '左侧AI']) {
        this.players = playerNames.map((name, index) => ({
            id: `player-${index}`,
            name: name,
            hand: [],
            isLandlord: false,
            playsCount: 0,
        }));
        this.deck = [];
        this.landlordCards = [];
        this.winner = null;
        this.gameState = 'pending';
        this.baseScore = 1;
        this.multiplier = 1;
        this.bidTurn = -1;
        this.highestBid = 0;
        this.bidWinner = null;
        this.passBidCount = 0;
        this.playTurn = -1;
        this.lastValidPlay = { playerId: null, cardType: null };
        this.passPlayCount = 0;
    }

    startGame() {
        this.deck = shuffle(createDeck());
        this.players.forEach(p => {
            p.hand = this.deck.splice(0, 17);
            this.sortHand(p.hand);
            p.playsCount = 0;
            p.isLandlord = false;
        });
        this.landlordCards = this.deck;
        this.gameState = 'bidding';
        this.bidTurn = Math.floor(Math.random() * this.players.length);
        this.multiplier = 1;
        this.highestBid = 0;
        this.bidWinner = null;
        this.passBidCount = 0;
        this.lastValidPlay = { playerId: null, cardType: null };
        this.passPlayCount = 0;
        this.winner = null;
    }

    playerBid(playerId, bid) {
        if (this.gameState !== 'bidding' || this.players[this.bidTurn].id !== playerId) return false;
        if (bid > 0 && bid > this.highestBid) {
            this.highestBid = bid;
            this.bidWinner = this.players[this.bidTurn];
            this.passBidCount = 0;
        } else {
            this.passBidCount++;
        }
        if (this.highestBid === 3 || (this.bidWinner && this.passBidCount >= this.players.length - 1)) {
            this.setLandlord(this.bidWinner);
        } else if (this.passBidCount >= this.players.length) {
            this.startGame();
        } else {
            this.bidTurn = (this.bidTurn + 1) % this.players.length;
        }
        return true;
    }

    setLandlord(landlordPlayer) {
        if (!landlordPlayer) {
            this.startGame();
            return;
        }
        landlordPlayer.isLandlord = true;
        landlordPlayer.hand.push(...this.landlordCards);
        this.sortHand(landlordPlayer.hand);
        this.baseScore = this.highestBid;
        this.gameState = 'playing';
        this.playTurn = this.players.findIndex(p => p.id === landlordPlayer.id);
        this.multiplier = 1;
        this.lastValidPlay = { playerId: null, cardType: null };
        this.passPlayCount = 0;
    }

    playCards(playerId, cardIds) {
        if (this.gameState !== 'playing' || this.players[this.playTurn].id !== playerId) return null;
        const player = this.getPlayerById(playerId);
        const cardsToPlay = player.hand.filter(c => cardIds.includes(c.id));
        if (cardsToPlay.length !== cardIds.length) return null;
        const myPlayType = parseCardType(cardsToPlay);
        if (!myPlayType) return null;
        const lastPlayType = (this.passPlayCount < this.players.length - 1) ? this.lastValidPlay.cardType : null;
        if (!canPlayOver(myPlayType, lastPlayType)) return null;
        player.hand = player.hand.filter(c => !cardIds.includes(c.id));
        player.playsCount++;
        if (myPlayType.type === 'bomb' || myPlayType.type === 'rocket') {
            this.multiplier *= 2;
        }
        this.lastValidPlay = { playerId, cardType: myPlayType };
        this.passPlayCount = 0;
        if (this.checkWinner()) {
            this.endGame();
        } else {
            this.nextPlayTurn();
        }
        return { playedCards: cardsToPlay, cardType: myPlayType };
    }

    passTurn(playerId) {
        if (this.gameState !== 'playing' || this.players[this.playTurn].id !== playerId) return false;
        const isFreePlay = this.passPlayCount >= this.players.length - 1 || !this.lastValidPlay.playerId;
        if (isFreePlay) return false;
        this.passPlayCount++;
        this.nextPlayTurn();
        return true;
    }

    nextPlayTurn() {
        this.playTurn = (this.playTurn + 1) % this.players.length;
    }

    checkWinner() {
        const winner = this.players.find(p => p.hand.length === 0);
        if (winner) {
            this.winner = winner;
            this.gameState = 'ended';
            // 春天/反春判定
            const landlordPlays = this.players.find(p => p.isLandlord).playsCount;
            if (winner.isLandlord && this.players.every(p => p.isLandlord || p.playsCount === 0)) {
                this.multiplier *= 2;
            } else if (!winner.isLandlord && landlordPlays <= 1) {
                this.multiplier *= 2;
            }
            return true;
        }
        return false;
    }

    endGame() {
        // 可扩展结算逻辑
    }

    // --- AI智能叫分 ---
    aiSimpleBid(aiPlayerId) {
        // 智能AI叫分逻辑
        const player = this.getPlayerById(aiPlayerId);
        const hand = player.hand;
        let score = 0;
        let bombCount = 0, kingCount = 0, highCardCount = 0, longStraight = 0;
        hand.forEach(c => {
            if (c.rank === 98 || c.rank === 99) kingCount++;
            if (hand.filter(x => x.rank === c.rank).length === 4) bombCount++;
            if (c.rank >= 14) highCardCount++;
        });
        let ranks = [...new Set(hand.map(c => c.rank))].sort((a, b) => a - b);
        let current = 1, maxStraight = 1;
        for (let i = 1; i < ranks.length; i++) {
            if (ranks[i] === ranks[i-1] + 1 && ranks[i] < 14) current++;
            else current = 1;
            if (current > maxStraight) maxStraight = current;
        }
        longStraight = maxStraight;
        score = bombCount*2 + kingCount + highCardCount*0.5 + (longStraight>=5?1:0);
        if (score >= 4 && this.highestBid < 3) return 3;
        if (score >= 2.5 && this.highestBid < 2) return 2;
        if (score >= 1.2 && this.highestBid < 1) return 1;
        return 0;
    }

    // --- AI智能出牌（优先复杂牌型） ---
    aiSimplePlay(aiPlayerId) {
        const player = this.getPlayerById(aiPlayerId);
        const isFreePlay = this.passPlayCount >= 2 || !this.lastValidPlay.cardType;
        const allPlays = this.findAllPlays(player.hand, true); // true:复杂牌型
        let validPlays = isFreePlay ? allPlays : allPlays.filter(play => canPlayOver(play, this.lastValidPlay.cardType));
        // 优先顺子 > 连对 > 飞机 > 三带 > 对子 > 单张，炸弹/王留到最后
        const priority = ['rocket', 'bomb', 'airplane_pairs', 'airplane_singles', 'airplane', 'straight', 'consecutive_pairs', 'trio_pair', 'trio_single', 'trio', 'pair', 'single'];
        validPlays.sort((a, b) => priority.indexOf(a.type) - priority.indexOf(b.type) || a.rank - b.rank);
        if (validPlays.length > 0) {
            return this.playCards(aiPlayerId, validPlays[0].cards.map(c => c.id));
        }
        return this.passTurn(aiPlayerId) ? null : this.playSmallest(aiPlayerId);
    }

    playSmallest(playerId) {
        const player = this.getPlayerById(playerId);
        const cardToPlay = player.hand[player.hand.length - 1];
        return this.playCards(playerId, [cardToPlay.id]);
    }

    // 扫描全部可出牌型（支持复杂牌型）
    findAllPlays(hand, supportComplex = false) {
        const plays = [];
        // 使用全排列/组合方式枚举所有可能牌型（复杂的可以用更高效的算法优化）
        const n = hand.length;
        for (let size = 1; size <= Math.min(n, 8); size++) {
            for (let i = 0; i <= n - size; i++) {
                const slice = hand.slice(i, i + size);
                const t = parseCardType(slice);
                if (t) plays.push(t);
            }
        }
        // 火箭
        const jokerCards = hand.filter(c => c.rank >= 98);
        if (jokerCards.length === 2) {
            const t = parseCardType(jokerCards);
            if (t) plays.push(t);
        }
        return plays;
    }

    sortHand = (hand) => hand.sort((a, b) => b.rank - a.rank);
    getPlayerById = (id) => this.players.find(p => p.id === id);
    getCurrentBiddingPlayer = () => this.players[this.bidTurn];
    getCurrentPlayingPlayer = () => this.players[this.playTurn];
    getWinner = () => this.winner;
}
