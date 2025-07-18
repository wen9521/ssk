/**
 * doudizhu-rules.js
 * 
 * 斗地主游戏的核心规则和状态机。
 * 集成了叫地主(bidding)和游戏进行(playing)两个核心阶段。
 */

import { createDeck, shuffle } from './deck.js';
import { parseCardType, canPlayOver } from './card-logic.js';

export class DouDizhuGame {
    constructor(playerNames = ['您', '右侧AI', '左侧AI']) {
        // --- 游戏通用状态 ---
        this.players = playerNames.map((name, index) => ({
            id: `player-${index}`,
            name: name,
            hand: [],
            isLandlord: false,
        }));
        this.deck = [];
        this.landlordCards = [];
        this.winner = null;
        this.gameState = 'pending'; // pending, bidding, playing, ended

        // --- 叫地主(bidding)阶段状态 ---
        this.bidTurn = -1; // 当前叫分的玩家索引
        this.highestBid = 0; // 当前最高的叫分
        this.bidWinner = null; // 叫地主赢家
        this.passBidCount = 0; // 连续不叫的人数
        
        // --- 出牌(playing)阶段状态 ---
        this.playTurn = -1; // 当前出牌的玩家索引
        this.lastValidPlay = { playerId: null, cardType: null };
        this.passPlayCount = 0;
    }

    /**
     * 开始一局新游戏
     * 流程：洗牌 -> 发牌 -> 进入叫地主环节
     */
    startGame() {
        this.deck = shuffle(createDeck());
        this.players.forEach(p => {
            p.hand = this.deck.splice(0, 17);
            this.sortHand(p.hand);
        });
        this.landlordCards = this.deck;
        
        // 进入叫地主环节
        this.gameState = 'bidding';
        this.bidTurn = Math.floor(Math.random() * this.players.length); // 随机一个玩家先叫
    }

    /**
     * 玩家叫分或不叫
     * @param {string} playerId 玩家ID
     * @param {number} bid 分数 (1, 2, 3) 或 0 (不叫)
     * @returns {boolean} 操作是否成功
     */
    playerBid(playerId, bid) {
        if (this.gameState !== 'bidding' || this.players[this.bidTurn].id !== playerId) {
            return false;
        }

        if (bid > 0 && bid > this.highestBid) {
            this.highestBid = bid;
            this.bidWinner = this.players[this.bidTurn];
            this.passBidCount = 0;
        } else {
            this.passBidCount++;
        }

        // 如果有人叫了3分，或者有赢家且其他人都pass了，则叫地主结束
        if (this.highestBid === 3 || (this.bidWinner && this.passBidCount >= 2)) {
            this.setLandlord(this.bidWinner);
            return true;
        }
        
        // 如果所有人都pass，则重新开始
        if (this.passBidCount >= 3) {
            // 在实际游戏中可能会有流局处理，这里简化为重新开始
            this.startGame();
            return true;
        }

        // 轮到下一个玩家叫分
        this.bidTurn = (this.bidTurn + 1) % this.players.length;
        return true;
    }

    /**
     * AI叫地主逻辑
     * @param {string} aiPlayerId 
     */
    aiSimpleBid(aiPlayerId) {
        const player = this.getPlayerById(aiPlayerId);
        const handStrength = this.evaluateHand(player.hand);
        
        let bid = 0;
        if (handStrength > 20 && this.highestBid < 3) bid = 3;
        else if (handStrength > 15 && this.highestBid < 2) bid = 2;
        else if (handStrength > 10 && this.highestBid < 1) bid = 1;

        this.playerBid(aiPlayerId, bid);
    }

    /**
     * 评估手牌强度
     * @param {Array<object>} hand
     * @returns {number}
     */
    evaluateHand(hand) {
        let score = 0;
        const plays = this.findAllPlays(hand);
        
        plays.forEach(p => {
            if (p.type === 'rocket') score += 10;
            if (p.type === 'bomb') score += 5;
            if (p.type === 'straight' && p.cards.length > 6) score += p.cards.length - 5;
            if (p.type === 'airplane') score += p.cards.length / 3;
        });
        
        hand.forEach(c => {
            if (c.rank >= 14) score += c.rank - 13; // 2 and jokers add to score
        });

        return score;
    }


    /**
     * 设置地主，并转换到出牌阶段
     * @param {object} landlordPlayer - 成为地主的玩家对象
     */
    setLandlord(landlordPlayer) {
        landlordPlayer.isLandlord = true;
        landlordPlayer.hand.push(...this.landlordCards);
        this.sortHand(landlordPlayer.hand);
        
        this.gameState = 'playing';
        this.playTurn = this.players.findIndex(p => p.id === landlordPlayer.id);
    }
    
    sortHand(hand) {
        hand.sort((a, b) => b.rank - a.rank);
    }
    
    playCards(playerId, cardIds) {
        if (this.gameState !== 'playing' || this.players[this.playTurn].id !== playerId) return null;

        const player = this.getPlayerById(playerId);
        const cardsToPlay = player.hand.filter(c => cardIds.includes(c.id));
        if (cardsToPlay.length !== cardIds.length) return null;

        const myPlayType = parseCardType(cardsToPlay);
        if (!myPlayType) return null;

        const lastPlayType = (this.passPlayCount < 2) ? this.lastValidPlay.cardType : null;
        if (!canPlayOver(myPlayType, lastPlayType)) return null;

        player.hand = player.hand.filter(c => !cardIds.includes(c.id));
        
        this.lastValidPlay = { playerId, cardType: myPlayType };
        this.passPlayCount = 0;
        
        this.checkWinner();
        if (!this.winner) this.nextPlayTurn();

        return { playedCards: cardsToPlay, cardType: myPlayType };
    }

    passTurn(playerId) {
        if (this.gameState !== 'playing' || this.players[this.playTurn].id !== playerId) return false;
        
        const isFreePlay = this.passPlayCount >= 2 || !this.lastValidPlay.playerId;
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
        }
    }

    aiSimplePlay(aiPlayerId) {
        const player = this.getPlayerById(aiPlayerId);
        const isFreePlay = this.passPlayCount >= 2 || !this.lastValidPlay.cardType;
        const landlord = this.players.find(p => p.isLandlord);
        const isMyTeammateLastPlayer = this.lastValidPlay.playerId &&
            this.getPlayerById(this.lastValidPlay.playerId).isLandlord === player.isLandlord;

        if (isMyTeammateLastPlayer && landlord.hand.length > 1) {
            this.passTurn(aiPlayerId);
            return null;
        }

        const allPossiblePlays = this.findAllPlays(player.hand);

        if (isFreePlay) {
            if (allPossiblePlays.length > 0) {
                // 优先出顺子和飞机，然后是三带，最后是单张或对子
                const playPriorities = ['airplane_singles', 'airplane_pairs', 'airplane', 'straight', 'consecutive_pairs', 'trio_single', 'trio_pair', 'pair', 'single'];
                for(const type of playPriorities) {
                    const play = allPossiblePlays.find(p => p.type === type);
                    if (play) {
                        return this.playCards(aiPlayerId, play.cards.map(c => c.id));
                    }
                }
            }
            // 如果啥也出不了，就出最小的单张
            const cardToPlay = player.hand[player.hand.length - 1];
            return this.playCards(aiPlayerId, [cardToPlay.id]);
        }

        const validPlays = allPossiblePlays.filter(play => canPlayOver(play, this.lastValidPlay.cardType));
        if (validPlays.length > 0) {
            validPlays.sort((a, b) => a.rank - b.rank);
            if (!player.isLandlord && landlord.hand.length === 1 && validPlays.length > 0) {
                const biggestPlay = validPlays[validPlays.length - 1];
                return this.playCards(aiPlayerId, biggestPlay.cards.map(c => c.id));
            }
            return this.playCards(aiPlayerId, validPlays[0].cards.map(c => c.id));
        }
        
        this.passTurn(aiPlayerId);
        return null;
    }

    findAllPlays(hand) {
        let plays = [];
        const rankCounts = new Map();
        hand.forEach(c => rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1));
        
        // 1. 找出所有单张、对子、三条、炸弹
        rankCounts.forEach((count, rank) => {
            const cards = hand.filter(c => c.rank === rank);
            if (count >= 1) plays.push(parseCardType(cards.slice(0, 1))); // 单张
            if (count >= 2) plays.push(parseCardType(cards.slice(0, 2))); // 对子
            if (count >= 3) plays.push(parseCardType(cards.slice(0, 3))); // 三条
            if (count === 4) plays.push(parseCardType(cards)); // 炸弹
        });

        // 2. 找出所有顺子
        const singleRanks = [...rankCounts.keys()].filter(r => r < 14).sort((a, b) => a - b);
        for (let i = 0; i <= singleRanks.length - 5; i++) {
            for (let j = 5; i + j <= singleRanks.length; j++) {
                const sub = singleRanks.slice(i, i + j);
                if (sub[sub.length - 1] - sub[0] === sub.length - 1) {
                    const straightCards = sub.map(rank => hand.find(c => c.rank === rank));
                    plays.push(parseCardType(straightCards));
                }
            }
        }
        
        // 3. 找出所有连对
        const pairRanks = [...rankCounts.keys()].filter(r => rankCounts.get(r) >= 2 && r < 14).sort((a, b) => a - b);
        for (let i = 0; i <= pairRanks.length - 3; i++) {
            for (let j = 3; i + j <= pairRanks.length; j++) {
                const sub = pairRanks.slice(i, i + j);
                if (sub[sub.length - 1] - sub[0] === sub.length - 1) {
                    const consecutivePairCards = sub.flatMap(rank => hand.filter(c => c.rank === rank).slice(0, 2));
                    plays.push(parseCardType(consecutivePairCards));
                }
            }
        }
        
        // 4. 找出所有飞机 (带翼和不带翼)
        const trioRanks = [...rankCounts.keys()].filter(r => rankCounts.get(r) >= 3 && r < 14).sort((a, b) => a - b);
        for (let i = 0; i <= trioRanks.length - 2; i++) {
            for (let j = 2; i + j <= trioRanks.length; j++) {
                const sub = trioRanks.slice(i, i + j);
                if (sub[sub.length - 1] - sub[0] === sub.length - 1) {
                    const airplaneCards = sub.flatMap(rank => hand.filter(c => c.rank === rank).slice(0, 3));
                    plays.push(parseCardType(airplaneCards)); // 不带翼

                    // 带单翼
                    const kickerCandidates = hand.filter(c => !airplaneCards.includes(c));
                    if (kickerCandidates.length >= j) {
                        const singleKickers = kickerCandidates.slice(0, j);
                        plays.push(parseCardType([...airplaneCards, ...singleKickers]));
                    }

                    // 带对翼
                    const pairKickerCandidates = kickerCandidates.filter(c => kickerCandidates.filter(c2 => c2.rank === c.rank).length >= 2);
                    if (pairKickerCandidates.length >= j * 2) {
                        const pairKickers = pairKickerCandidates.slice(0, j * 2);
                        plays.push(parseCardType([...airplaneCards, ...pairKickers]));
                    }
                }
            }
        }

        // 5. 找出所有三带一、三带二
        const trios = [...rankCounts.entries()].filter(([, count]) => count === 3);
        const singles = [...rankCounts.entries()].filter(([, count]) => count === 1);
        const pairs = [...rankCounts.entries()].filter(([, count]) => count === 2);

        for (const [rank] of trios) {
            const trioCards = hand.filter(c => c.rank === rank);
            if (singles.length > 0) {
                plays.push(parseCardType([...trioCards, hand.find(c => c.rank === singles[0][0])]));
            }
            if (pairs.length > 0) {
                 plays.push(parseCardType([...trioCards, ...hand.filter(c => c.rank === pairs[0][0])]));
            }
        }

        return plays.filter(p => p); // 过滤掉无效的plays
    }
    
    // ----------- 辅助 getter 方法 -----------
    getPlayerById = (id) => this.players.find(p => p.id === id);
    getCurrentBiddingPlayer = () => this.players[this.bidTurn];
    getCurrentPlayingPlayer = () => this.players[this.playTurn];
    getWinner = () => this.winner;
}
