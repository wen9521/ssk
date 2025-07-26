/**
 * src/game-logic/doudizhu.rules.js
 * Dou Dizhu 游戏核心规则与工具函数
 */

// 牌面值映射
export const valueMap = {
  '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  '2': 16, 'BlackJoker': 17, 'RedJoker': 18
};

// 花色列表
const SUITS = ['♠', '♥', '♣', '♦'];

// 仅大小王常量
export const JokerRanks = ['BlackJoker', 'RedJoker'];

// 支持的出牌类型枚举
export const HandType = {
  SINGLE: 'single',
  PAIR: 'pair',
  TRIO: 'trio',
  TRIO_WITH_SINGLE: 'trio_with_single',
  TRIO_WITH_PAIR: 'trio_with_pair',
  STRAIGHT: 'straight',
  BOMB: 'bomb',
  ROCKET: 'rocket'
};

/**
 * 生成一副完整 54 张牌
 */
export function generateDeck() {
  const deck = [];
  for (let rank in valueMap) {
    if (JokerRanks.includes(rank)) continue;
    SUITS.forEach(suit => {
      deck.push({ rank, suit, value: valueMap[rank] });
    });
  }
  // 添加大小王
  deck.push({ rank: 'BlackJoker', suit: null, value: valueMap.BlackJoker });
  deck.push({ rank: 'RedJoker', suit: null, value: valueMap.RedJoker });
  return deck;
}

/**
 * Fisher–Yates 洗牌算法
 */
export function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * 按牌面值从小到大排序
 */
export function sortCards(cards) {
  return cards.slice().sort((a, b) => a.value - b.value);
}

/**
 * 将一手牌解析成 { rankCounts, sortedRanks }
 */
export function parseHand(cards) {
  const rankCounts = {};
  cards.forEach(c => {
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  });
  const sortedRanks = Object.keys(rankCounts).sort(
    (a, b) => valueMap[a] - valueMap[b]
  );
  return { rankCounts, sortedRanks };
}

/**
 * 判断当前出牌是否合法（骨架，需补全各种牌型识别逻辑）
 */
export function canPlay(prevPlay, currentPlay) {
  // TODO: 针对 HandType 做完整牌型识别与比较
  // 比如：rocket > bomb > [straight, trio, pair, single]
  return true;
}

/**
 * 随机选地主示例（可替换为叫分逻辑）
 */
export function chooseLandlord(playerIds) {
  const idx = Math.floor(Math.random() * playerIds.length);
  return playerIds[idx];
}

/**
 * Dou Dizhu 游戏主类
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

    // 留 3 张底牌
    this.landlordExtraCards = deck.slice(-3);
    deck = deck.slice(0, -3);

    // 发每人 17 张
    this.playerIds.forEach((pid, idx) => {
      this.hands[pid] = sortCards(deck.slice(idx * 17, (idx + 1) * 17));
    });

    // 选地主并补底牌
    this.landlordId = chooseLandlord(this.playerIds);
    this.hands[this.landlordId] = sortCards(
      this.hands[this.landlordId].concat(this.landlordExtraCards)
    );
    this.currentPlayer = this.landlordId;
  }

  playCards(playerId, cards) {
    if (playerId !== this.currentPlayer) {
      throw new Error('当前不在此玩家回合');
    }
    if (!canPlay(this.lastPlay, cards)) {
      throw new Error('出牌不合法');
    }
    // 移除已出的牌
    this.hands[playerId] = this.hands[playerId].filter(c =>
      !cards.some(pc => pc.rank === c.rank && pc.suit === c.suit)
    );
    this.lastPlay = { playerId, cards };
    this.currentPlayer = this.getNextPlayer(playerId);
    return { lastPlay: this.lastPlay, currentPlayer: this.currentPlayer };
  }

  pass(playerId) {
    if (playerId !== this.currentPlayer) {
      throw new Error('当前不在此玩家回合');
    }
    this.currentPlayer = this.getNextPlayer(playerId);
    return { lastPlay: this.lastPlay, currentPlayer: this.currentPlayer };
  }

  getNextPlayer(pid) {
    const idx = this.playerIds.indexOf(pid);
    return this.playerIds[(idx + 1) % this.playerIds.length];
  }

  isGameOver() {
    return this.playerIds.some(pid => this.hands[pid].length === 0);
  }

  getWinner() {
    return this.playerIds.find(pid => this.hands[pid].length === 0) || null;
  }
}