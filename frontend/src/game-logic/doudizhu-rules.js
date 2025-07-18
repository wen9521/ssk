/**
 * doudizhu-rules.js
 * 
 * 斗地主游戏的核心规则和状态机。
 * 这个模块独立于UI，只负责游戏本身的逻辑。
 */

import { createDeck, shuffle } from './deck.js';
import { parseCardType } from './card-logic.js'; // 我们将在下一步创建这个文件

export class DouDizhuGame {
    constructor(playerNames = ['玩家', '左侧AI', '上方AI']) {
        this.deck = [];
        this.players = playerNames.map((name, index) => ({
            id: `player-${index}`,
            name: name,
            hand: [],
            isLandlord: false,
        }));
        this.landlordCards = []; // 底牌
        this.turn = -1; // 当前轮到出牌的玩家索引，-1表示游戏未开始
        this.lastValidPlay = { playerId: null, cardType: null }; // 记录上一手合法的出牌信息
        this.passCount = 0; // 连续“不要”的玩家数量
        this.winner = null; // 游戏获胜者
    }

    /**
     * 开始一局新游戏
     * 流程：洗牌 -> 发牌 -> 决定地主 -> 排序手牌
     */
    startGame() {
        this.deck = shuffle(createDeck());
        
        // 发牌，每人17张
        for (let i = 0; i < 17; i++) {
            for (const player of this.players) {
                if (this.deck.length > 0) {
                    player.hand.push(this.deck.pop());
                }
            }
        }
        
        // 剩下的3张是底牌
        this.landlordCards = this.deck;
        
        // 简单处理：默认第一个玩家是地主
        this.setLandlord(this.players[0]);
        
        // 排序所有玩家的手牌
        this.players.forEach(player => this.sortHand(player.hand));
        
        console.log('游戏开始! 状态:', this);
    }

    /**
     * 设置地主
     * @param {object} landlordPlayer - 成为地主的玩家对象
     */
    setLandlord(landlordPlayer) {
        const player = this.getPlayerById(landlordPlayer.id);
        if (player) {
            player.isLandlord = true;
            player.hand.push(...this.landlordCards);
            this.sortHand(player.hand);
            
            // 地主先出牌
            this.turn = this.players.findIndex(p => p.id === player.id);
        }
    }
    
    /**
     * 对手牌进行排序（按rank降序）
     * @param {Array} hand - 要排序的手牌数组
     */
    sortHand(hand) {
        hand.sort((a, b) => b.rank - b.rank);
    }
    
    /**
     * 玩家出牌的核心逻辑
     * @param {string} playerId - 出牌玩家的ID
     * @param {Array<string>} cardIds - 玩家选择要出的牌的ID数组
     * @returns {object|null} - 如果出牌有效，返回{ playedCards, cardType }，否则返回null
     */
    playCards(playerId, cardIds) {
        if (this.players[this.turn].id !== playerId) {
            return null; // 没轮到该玩家
        }
        
        const player = this.getPlayerById(playerId);
        const cardsToPlay = player.hand.filter(card => cardIds.includes(card.id));
        
        // 1. 检查牌是否在手牌中
        if (cardsToPlay.length !== cardIds.length) {
            console.error("出牌错误：包含不存在于手牌中的牌。");
            return null;
        }

        // 2. 解析出牌的牌型 (下一步会创建 parseCardType)
        const currentPlayType = parseCardType(cardsToPlay);
        if (!currentPlayType) {
            console.log("出牌无效：不构成任何有效牌型。");
            return null; // 无效牌型
        }

        // 3. 验证是否能大过上一手牌
        if (this.lastValidPlay.playerId && this.lastValidPlay.playerId !== playerId) {
            if (!this.canBeatLastPlay(currentPlayType)) {
                console.log("出牌无效：无法大过上一手牌。");
                return null;
            }
        }

        // 4. 执行出牌
        player.hand = player.hand.filter(card => !cardIds.includes(card.id));
        
        // 5. 更新游戏状态
        this.lastValidPlay = { playerId, cardType: currentPlayType };
        this.passCount = 0; // 重置“不要”计数
        this.checkWinner();

        return { playedCards: cardsToPlay, cardType: currentPlayType };
    }

    /**
     * 比较当前出牌是否能大过上一手
     * @param {object} currentPlayType - 当前出牌的牌型对象
     * @returns {boolean}
     */
    canBeatLastPlay(currentPlayType) {
        const lastPlayType = this.lastValidPlay.cardType;
        if (!lastPlayType) return true; // 自由出牌

        // 规则1：炸弹可以大过任何非炸弹牌型
        if (currentPlayType.type === 'bomb' && lastPlayType.type !== 'bomb') return true;
        if (currentPlayType.type === 'rocket' ) return true;

        // 规则2：牌型必须相同，且 rank 更高
        if (currentPlayType.type === lastPlayType.type && currentPlayType.cards.length === lastPlayType.cards.length) {
            return currentPlayType.rank > lastPlayType.rank;
        }
        
        return false;
    }

    /**
     * 玩家选择“不要”
     * @param {string} playerId - 跳过玩家的ID
     * @returns {boolean} - 操作是否成功
     */
    passTurn(playerId) {
        if (this.players[this.turn].id !== playerId) {
            return false; // 没轮到该玩家
        }
        // 如果是自由出牌阶段，不能“不要”
        if (!this.lastValidPlay.playerId) {
            return false;
        }
        
        this.passCount++;
        // 如果连续两个玩家“不要”，则出牌权回到上一个出牌的玩家，并可以自由出牌
        if (this.passCount >= 2) {
            this.lastValidPlay = { playerId: null, cardType: null };
            this.passCount = 0;
            this.turn = this.players.findIndex(p => p.id === this.lastValidPlay.playerId);
        }
        return true;
    }
    
    /**
     * 切换到下一个玩家
     */
    nextTurn() {
        this.turn = (this.turn + 1) % this.players.length;
    }
    
    /**
     * 检查是否有玩家获胜
     */
    checkWinner() {
        const winner = this.players.find(p => p.hand.length === 0);
        if (winner) {
            this.winner = winner;
        }
    }

    /**
     * 简单的AI出牌逻辑
     * @param {string} aiPlayerId - AI玩家的ID
     * @returns {object|null} - 如果出牌，返回出牌信息，否则返回null
     */
    aiSimplePlay(aiPlayerId) {
        // 这是一个非常简化的AI，只会尝试打出最小的单张，如果大不过就跳过
        const player = this.getPlayerById(aiPlayerId);
        
        // 如果可以自由出牌，就出最小的一张牌
        if (!this.lastValidPlay.cardType) {
            const cardToPlay = player.hand[player.hand.length - 1];
            return this.playCards(aiPlayerId, [cardToPlay.id]);
        }

        // 否则，尝试找一张能打过上家的单牌
        for (let i = player.hand.length - 1; i >= 0; i--) {
            const card = player.hand[i];
            const potentialPlay = parseCardType([card]); // 尝试解析为单牌
            if (potentialPlay && this.canBeatLastPlay(potentialPlay)) {
                return this.playCards(aiPlayerId, [card.id]);
            }
        }
        
        // 找不到能打过的牌，选择“不要”
        this.passTurn(aiPlayerId);
        return null;
    }
    
    // ----------- 辅助 getter 方法 -----------
    getPlayerById = (id) => this.players.find(p => p.id === id);
    getCurrentPlayer = () => this.players[this.turn];
    getWinner = () => this.winner;
}
