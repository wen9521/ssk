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
     * 简单的AI叫地主逻辑
     * @param {string} aiPlayerId 
     */
    aiSimpleBid(aiPlayerId) {
        const player = this.getPlayerById(aiPlayerId);
        // AI根据手牌里大牌的数量来决定叫多少分
        const power = player.hand.filter(c => c.rank >= 14).length; // 2和王越多，越可能叫
        
        let bid = 0;
        if (power >= 4 && this.highestBid < 3) bid = 3;
        else if (power >= 3 && this.highestBid < 2) bid = 2;
        else if (power >= 2 && this.highestBid < 1) bid = 1;

        this.playerBid(aiPlayerId, bid);
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

        if (isFreePlay) {
            const cardToPlay = player.hand[player.hand.length - 1];
            return this.playCards(aiPlayerId, [cardToPlay.id]);
        }

        for (let i = 1; i <= player.hand.length; i++) {
            const combinations = this.findCardCombinations(player.hand, i);
            for (const combo of combinations) {
                const potentialPlay = parseCardType(combo);
                if (potentialPlay && canPlayOver(potentialPlay, this.lastValidPlay.cardType)) {
                    return this.playCards(aiPlayerId, combo.map(c => c.id));
                }
            }
        }
        
        this.passTurn(aiPlayerId);
        return null;
    }
    
    findCardCombinations(hand, size) {
        const result = [];
        function combine(start, currentCombo) {
            if (currentCombo.length === size) {
                result.push(currentCombo);
                return;
            }
            if (start === hand.length) return;
            // 优化：剪枝，如果剩余的牌都不够凑齐size，就不用继续了
            if (hand.length - start < size - currentCombo.length) {
                return;
            }
            combine(start + 1, [...currentCombo, hand[start]]); // 包含 hand[start]
            combine(start + 1, currentCombo); // 不包含 hand[start]
        }
        combine(0, []);
        return result;
    }
    
    // ----------- 辅助 getter 方法 -----------
    getPlayerById = (id) => this.players.find(p => p.id === id);
    getCurrentBiddingPlayer = () => this.players[this.bidTurn];
    getCurrentPlayingPlayer = () => this.players[this.playTurn];
    getWinner = () => this.winner;
}
