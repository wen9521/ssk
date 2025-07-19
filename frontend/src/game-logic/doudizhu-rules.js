/**
 * doudizhu-rules.js (Refactored)
 *
 * 斗地主游戏的核心规则和状态机。
 * - 增加了计分系统 (春天, 炸弹, 火箭)。
 * - 重构了AI的出牌查找逻辑 (findAllPlays)，使其更高效、准确。
 * - 优化了游戏状态管理。
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
            playsCount: 0, // 记录玩家出牌次数
        }));
        this.deck = [];
        this.landlordCards = [];
        this.winner = null;
        this.gameState = 'pending'; // pending, bidding, playing, ended

        // --- 计分系统 ---
        this.baseScore = 1; // 底分
        this.multiplier = 1; // 倍率 (来自炸弹、春天等)

        // --- 叫地主(bidding)阶段状态 ---
        this.bidTurn = -1;
        this.highestBid = 0;
        this.bidWinner = null;
        this.passBidCount = 0;
        
        // --- 出牌(playing)阶段状态 ---
        this.playTurn = -1;
        this.lastValidPlay = { playerId: null, cardType: null };
        this.passPlayCount = 0;
    }

    startGame() {
        this.deck = shuffle(createDeck());
        this.players.forEach(p => {
            p.hand = this.deck.splice(0, 17);
            this.sortHand(p.hand);
            p.playsCount = 0; // 重置出牌次数
        });
        this.landlordCards = this.deck;
        
        this.gameState = 'bidding';
        this.bidTurn = Math.floor(Math.random() * this.players.length);
        this.multiplier = 1;
        this.highestBid = 0;
        this.bidWinner = null;
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
            this.startGame(); // 流局
        } else {
            this.bidTurn = (this.bidTurn + 1) % this.players.length;
        }
        return true;
    }

    setLandlord(landlordPlayer) {
        if (!landlordPlayer) {
            this.startGame(); // 没有人叫地主，流局
            return;
        }
        landlordPlayer.isLandlord = true;
        landlordPlayer.hand.push(...this.landlordCards);
        this.sortHand(landlordPlayer.hand);
        
        this.baseScore = this.highestBid;
        this.gameState = 'playing';
        this.playTurn = this.players.findIndex(p => p.id === landlordPlayer.id);
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

        // 更新手牌
        player.hand = player.hand.filter(c => !cardIds.includes(c.id));
        player.playsCount++;
        
        // 更新倍率
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
    
    checkWinner() {
        const winner = this.players.find(p => p.hand.length === 0);
        if (winner) {
            this.winner = winner;
            this.gameState = 'ended';
            // 检查春天
            if (winner.isLandlord && this.players.every(p => p.isLandlord || p.playsCount === 0)) {
                this.multiplier *= 2; // 春天翻倍
            } else if (!winner.isLandlord && this.getPlayerById(this.players.find(p => p.isLandlord).id).playsCount <= 1) {
                this.multiplier *= 2; // 反春翻倍
            }
            return true;
        }
        return false;
    }

    endGame() {
        const finalScore = this.baseScore * this.multiplier;
        // 在这里可以添加后续逻辑，比如显示结算画面
        console.log(`游戏结束! 胜利者: ${this.winner.name}, 最终得分: ${finalScore}`);
    }

    aiSimplePlay(aiPlayerId) {
        const player = this.getPlayerById(aiPlayerId);
        const isFreePlay = this.passPlayCount >= 2 || !this.lastValidPlay.cardType;
        
        // 队友出牌，且地主剩的牌还多，就pass
        const landlord = this.players.find(p => p.isLandlord);
        const teammateIsLastPlayer = this.lastValidPlay.playerId && this.getPlayerById(this.lastValidPlay.playerId).isLandlord === player.isLandlord;
        if (teammateIsLastPlayer && landlord.hand.length > 2) {
            return this.passTurn(aiPlayerId) ? null : this.playSmallest(aiPlayerId);
        }
        
        const allPlays = this.findAllPlays(player.hand);
        const validPlays = isFreePlay ? allPlays : allPlays.filter(play => canPlayOver(play, this.lastValidPlay.cardType));

        if (validPlays.length > 0) {
             // 如果地主只剩一张牌，农民要用最大的牌来压
            if (!player.isLandlord && landlord.hand.length === 1) {
                 validPlays.sort((a, b) => b.rank - a.rank);
                 return this.playCards(aiPlayerId, validPlays[0].cards.map(c => c.id));
            }
            // 否则，出最小的能大过的牌
            validPlays.sort((a, b) => a.rank - b.rank);
            return this.playCards(aiPlayerId, validPlays[0].cards.map(c => c.id));
        }

        return this.passTurn(aiPlayerId) ? null : this.playSmallest(aiPlayerId);
    }
    
    playSmallest(playerId) {
        const player = this.getPlayerById(playerId);
        const cardToPlay = player.hand[player.hand.length - 1];
        return this.playCards(playerId, [cardToPlay.id]);
    }

    /**
     * 高效查找所有可出牌型 (重构版)
     */
    findAllPlays(hand) {
        const plays = new Map(); // 使用Map防止重复
        const counts = new Map();
        hand.forEach(c => counts.set(c.rank, (counts.get(c.rank) || 0) + 1));
        const ranks = { singles: [], pairs: [], trios: [], fours: [] };
        counts.forEach((count, rank) => {
            if (count === 1) ranks.singles.push(rank);
            if (count === 2) ranks.pairs.push(rank);
            if (count === 3) ranks.trios.push(rank);
            if (count === 4) ranks.fours.push(rank);
        });

        const addPlay = (play) => {
            if(play) plays.set(JSON.stringify(play.cards.map(c=>c.id).sort()), play);
        };

        // 1. 基础牌型
        hand.forEach(c => addPlay(parseCardType([c]))); // 单张
        if (counts.has(98) && counts.has(99)) addPlay(parseCardType(hand.filter(c => c.rank >= 98))); // 火箭
        [...ranks.pairs, ...ranks.trios, ...ranks.fours].forEach(r => addPlay(parseCardType(hand.filter(c => c.rank === r).slice(0, 2)))); // 对子
        [...ranks.trios, ...ranks.fours].forEach(r => addPlay(parseCardType(hand.filter(c => c.rank === r).slice(0, 3)))); // 三条
        ranks.fours.forEach(r => addPlay(parseCardType(hand.filter(c => c.rank === r)))); // 炸弹

        // 2. 顺子、连对、飞机
        const findStraights = (rankList, minLen, type) => {
            const sortedRanks = rankList.filter(r => r < 14).sort((a, b) => a - b);
            for (let i = 0; i <= sortedRanks.length - minLen; i++) {
                for (let j = minLen; i + j <= sortedRanks.length; j++) {
                    const sub = sortedRanks.slice(i, i + j);
                    if (sub[sub.length - 1] - sub[0] === sub.length - 1) {
                        const cards = sub.flatMap(rank => hand.filter(c => c.rank === rank).slice(0, type === 'straight' ? 1 : type === 'consecutive_pairs' ? 2 : 3));
                        addPlay(parseCardType(cards));
                    }
                }
            }
        };
        findStraights([...counts.keys()], 5, 'straight');
        findStraights([...ranks.pairs, ...ranks.trios, ...ranks.fours], 3, 'consecutive_pairs');
        findStraights([...ranks.trios, ...ranks.fours], 2, 'airplane');

        // 3. 带翼组合
        const allTrios = ranks.trios.map(r => hand.filter(c => c.rank === r));
        const allFours = ranks.fours.map(r => hand.filter(c => c.rank === r));

        const addAttachments = (mainCards, numAttachments) => {
            if (numAttachments === 0) return;
            const remaining = hand.filter(c => !mainCards.find(mc => mc.id === c.id));
            if (remaining.length < numAttachments) return;
            
            // 带单牌
            if (remaining.length >= numAttachments) {
                addPlay(parseCardType([...mainCards, ...remaining.slice(0, numAttachments)]));
            }
            // 带对牌
            const pairCandidates = [...new Set(remaining.filter(c => remaining.filter(c2 => c2.rank === c.rank).length >= 2).map(c=>c.rank))];
            if (pairCandidates.length >= numAttachments) {
                 const kickerPairs = pairCandidates.slice(0, numAttachments).flatMap(r => remaining.filter(c => c.rank === r).slice(0, 2));
                 addPlay(parseCardType([...mainCards, ...kickerPairs]));
            }
        };
        
        allTrios.forEach(trio => addAttachments(trio, 1)); // 三带一
        allTrios.forEach(trio => addAttachments(trio, 2)); // 三带二 (实际是三带一对)
        allFours.forEach(four => addAttachments(four, 2)); // 四带二
        allFours.forEach(four => addAttachments(four, 4)); // 四带两对 (实际是四带两对)

        // 飞机带翼
        const trioGroups = this.findConsecutiveGroups(ranks.trios, 2);
        trioGroups.forEach(group => {
            const airplaneCards = group.flatMap(rank => hand.filter(c => c.rank === rank).slice(0, 3));
            addAttachments(airplaneCards, group.length); // 带单翼
            addAttachments(airplaneCards, group.length * 2); // 带对翼
        });

        return [...plays.values()];
    }
    
    findConsecutiveGroups(ranks, minLength) {
        const sorted = [...new Set(ranks)].filter(r => r < 14).sort((a,b) => a-b);
        const groups = [];
        if (sorted.length < minLength) return groups;
    
        let currentGroup = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === sorted[i-1] + 1) {
                currentGroup.push(sorted[i]);
            } else {
                if (currentGroup.length >= minLength) {
                    for (let j = minLength; j <= currentGroup.length; j++) {
                        for (let k = 0; k <= currentGroup.length - j; k++) {
                            groups.push(currentGroup.slice(k, k+j));
                        }
                    }
                }
                currentGroup = [sorted[i]];
            }
        }
        if (currentGroup.length >= minLength) {
            for (let j = minLength; j <= currentGroup.length; j++) {
                for (let k = 0; k <= currentGroup.length - j; k++) {
                   groups.push(currentGroup.slice(k, k+j));
                }
            }
        }
        return groups;
    }

    // --- 辅助方法 ---
    sortHand = (hand) => hand.sort((a, b) => b.rank - a.rank);
    getPlayerById = (id) => this.players.find(p => p.id === id);
    getCurrentBiddingPlayer = () => this.players[this.bidTurn];
    getCurrentPlayingPlayer = () => this.players[this.playTurn];
    getWinner = () => this.winner;
}
