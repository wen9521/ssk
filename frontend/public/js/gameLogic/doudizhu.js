// js/gameLogic/doudizhu.js
import { createDeck, shuffle } from '../utils/deck.js';

export class DouDizhuGame {
    constructor() {
        this.players = [ { id: 'player', hand: [] }, { id: 'ai1', hand: [] }, { id: 'ai2', hand: [] } ];
        this.landlord = null;
        this.landlordCards = [];
        this.turn = 0; // Index of the current player
        this.lastPlay = { player: null, cards: [] };
    }

    startGame() {
        const deck = shuffle(createDeck());
        // 发牌
        for (let i = 0; i < 17 * 3; i++) {
            this.players[i % 3].hand.push(deck.pop());
        }
        this.landlordCards = deck;

        // 简单处理：玩家默认是地主
        this.landlord = this.players[0];
        this.landlord.hand.push(...this.landlordCards);
        
        // 排序手牌
        this.players.forEach(p => this.sortHand(p.hand));

        console.log("游戏开始!", this);
    }
    
    sortHand(hand) {
        hand.sort((a, b) => b.rank - a.rank);
    }

    // 核心逻辑：判断出牌是否合法
    // 这是一个非常复杂的函数，这里只做最简单的示例
    isValidPlay(cardsToPlay) {
        if (cardsToPlay.length === 0) return false;
        
        // 规则：新的出牌必须和上家的出牌人不同，或者是自由出牌
        const lastPlayer = this.lastPlay.player;
        const currentPlayer = this.players[this.turn];
        if (lastPlayer && lastPlayer.id === currentPlayer.id) {
             this.lastPlay = { player: null, cards: [] }; // 新一轮出牌
        }

        // TODO: 实现复杂的牌型判断 (单张, 对子, 三带一, 顺子, 飞机, 炸弹...)
        // 简化版：只判断单张
        if (cardsToPlay.length === 1) {
            if (this.lastPlay.cards.length === 0 || (this.lastPlay.cards.length === 1 && cardsToPlay[0].rank > this.lastPlay.cards[0].rank)) {
                return true;
            }
        }
        // 简化版：跳过
        if (cardsToPlay.length === 0 && this.lastPlay.cards.length > 0) {
            return true;
        }

        return false;
    }

    // 玩家出牌
    play(cards) {
        const player = this.players[this.turn];
        
        // 从手牌中移除
        player.hand = player.hand.filter(card => !cards.find(c => c.id === card.id));

        if (cards.length > 0) {
            this.lastPlay = { player, cards };
        }
        
        this.nextTurn();
        
        // 返回游戏是否结束
        return player.hand.length === 0;
    }

    nextTurn() {
        this.turn = (this.turn + 1) % 3;
    }
    
    // 简单的AI逻辑
    aiTurn() {
        const aiPlayer = this.players[this.turn];
        // 简化版AI: 如果能打，就打出最小的一张牌；否则就跳过
        if (this.lastPlay.cards.length === 0) {
            const cardToPlay = aiPlayer.hand[aiPlayer.hand.length - 1]; // 出最小的牌
            this.play([cardToPlay]);
            return [cardToPlay];
        } else {
            // 找一张能打得过的最小的牌
            for (let i = aiPlayer.hand.length - 1; i >= 0; i--) {
                const card = aiPlayer.hand[i];
                if (this.isValidPlay([card])) {
                    this.play([card]);
                    return [card];
                }
            }
        }
        // 打不过，跳过
        this.play([]);
        return [];
    }
}
