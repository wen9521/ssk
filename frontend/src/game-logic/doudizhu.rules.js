/**
 * src/game-logic/doudizhu.rules.js
 * Dou Dizhu 游戏规则逻辑
 */

// 牌面值与花色定义
const CARD_VALUES = {
  '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  '2': 16, 'BlackJoker': 17, 'RedJoker': 18
};

const SUITS = ['♠', '♥', '♣', '♦'];

/**
 * 生成一副牌（54 张）
 */
function generateDeck() {
  const deck = [];
  for (let rank in CARD_VALUES) {
    if (rank === 'BlackJoker' || rank === 'RedJoker') continue;
    SUITS.forEach(suit => {
      deck.push({ suit, rank, value: CARD_VALUES[rank] });
    });
  }
  deck.push({ rank: 'BlackJoker', value: CARD_VALUES.BlackJoker });
  deck.push({ rank: 'RedJoker', value: CARD_VALUES.RedJoker });
  return deck;
}

/**
 * 随机洗牌
 */
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * 对手牌进行排序
 */
function sortCards(cards) {
  return cards.slice().sort((a, b) => a.value - b.value);
}

/**
 * 判断本次出牌是否合法（骨架，需要补充具体牌型逻辑）
 */
function isValidPlay(prevPlay, currentPlay) {
  // TODO: 实现牌型识别与大小比较
  return true;
}

/**
 * 抢地主或叫分逻辑（示例：随机选地主）
 */
function chooseLandlord(playerIds) {
  const idx = Math.floor(Math.random() * playerIds.length);
  return playerIds[idx];
}

/**
 * DoudizhuGame 类
 */
export class DoudizhuGame {
  constructor(playerIds = [], humanPlayerId = null) {
    this.playerIds = playerIds;
    this.humanPlayerId = humanPlayerId;
    this.landlordId = null;
    this.landlordExtraCards = [];
    this.hands = {};
    this.lastPlay = null;
    this.currentPlayer = null;
    this.initGame();
  }

  initGame() {
    let deck = generateDeck();
    shuffleDeck(deck);

    // 底牌 3 张
    this.landlordExtraCards = deck.slice(-3);
    deck = deck.slice(0, -3);

    // 每人 17 张
    this.playerIds.forEach((pid, idx) => {
      this.hands[pid] = sortCards(deck.slice(idx * 17, (idx + 1) * 17));
    });

    // 确定地主并给底牌
    this.landlordId = chooseLandlord(this.playerIds);
    this.hands[this.landlordId] = sortCards(
      this.hands[this.landlordId].concat(this.landlordExtraCards)
    );
    this.currentPlayer = this.landlordId;
  }

  /**
   * 玩家出牌
   */
  playCards(playerId, cards) {
    if (playerId !== this.currentPlayer) {
      throw new Error('当前不在此玩家回合');
    }
    if (!isValidPlay(this.lastPlay, cards)) {
      throw new Error('出牌不合法');
    }

    // 从手牌中移除已出的牌
    this.hands[playerId] = this.hands[playerId].filter(c =>
      !cards.some(pc => pc.rank === c.rank && pc.suit === c.suit)
    );

    this.lastPlay = { playerId, cards };
    this.currentPlayer = this.getNextPlayer(playerId);
    return { lastPlay: this.lastPlay, currentPlayer: this.currentPlayer };
  }

  /**
   * 玩家选择不出
   */
  pass(playerId) {
    if (playerId !== this.currentPlayer) {
      throw new Error('当前不在此玩家回合');
    }
    this.currentPlayer = this.getNextPlayer(playerId);
    return { lastPlay: this.lastPlay, currentPlayer: this.currentPlayer };
  }

  /**
   * 获取下一个玩家
   */
  getNextPlayer(playerId) {
    const idx = this.playerIds.indexOf(playerId);
    return this.playerIds[(idx + 1) % this.playerIds.length];
  }

  /**
   * 判断游戏是否结束
   */
  isGameOver() {
    return this.playerIds.some(pid => this.hands[pid].length === 0);
  }

  /**
   * 返回赢家
   */
  getWinner() {
    return this.playerIds.find(pid => this.hands[pid].length === 0) || null;
  }
}

// 其他工具函数按需导出
export {
  generateDeck,
  shuffleDeck,
  sortCards,
  isValidPlay,
  chooseLandlord
};