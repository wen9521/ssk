// src/game-logic/doudizhu.rules.js

export const JokerRanks = {
  BLACK_JOKER: 'black_joker',
  RED_JOKER: 'red_joker',
};

export const HandType = {
  INVALID: 'invalid',
  SINGLE: 'single',
  PAIR: 'pair',
  TRIPLE: 'triple',
  TRIPLE_WITH_SINGLE: 'triple_with_single',
  TRIPLE_WITH_PAIR: 'triple_with_pair',
  STRAIGHT: 'straight',
  DOUBLE_SEQUENCE: 'double_sequence',
  BOMB: 'bomb',
  ROCKET: 'rocket',
  FOUR_WITH_TWO: 'four_with_two',
  AIRPLANE: 'airplane',
  AIRPLANE_WITH_WINGS: 'airplane_with_wings',
};

export const valueMap = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  '2': 16,
  [JokerRanks.BLACK_JOKER]: 18,
  [JokerRanks.RED_JOKER]: 19,
};

/**
 * 将一手牌解析成类型和比较权值
 * @param {Array<{rank:string,suit:string}>} cards
 * @returns {{type:string, value:number, length:number}}
 */
export function parseHand(cards) {
  if (!cards || cards.length === 0) {
    return { type: HandType.INVALID, value: 0, length: 0 };
  }

  const counts = cards.reduce((o, c) => {
    o[c.rank] = (o[c.rank] || 0) + 1;
    return o;
  }, {});
  const uniqueRanks = Object.keys(counts);
  const vals = uniqueRanks.map(r => valueMap[r]).sort((a, b) => a - b);
  const len = cards.length;

  // Rocket
  if (len === 2 && counts[JokerRanks.BLACK_JOKER] && counts[JokerRanks.RED_JOKER]) {
    return { type: HandType.ROCKET, value: valueMap[JokerRanks.BLACK_JOKER], length: 2 };
  }

  // Bomb
  if (len === 4 && uniqueRanks.length === 1) {
    return { type: HandType.BOMB, value: valueMap[uniqueRanks[0]], length: 4 };
  }

  // Single / Pair / Triple
  if (uniqueRanks.length === 1) {
    const cnt = counts[uniqueRanks[0]];
    if (cnt === 1) return { type: HandType.SINGLE, value: valueMap[uniqueRanks[0]], length: 1 };
    if (cnt === 2) return { type: HandType.PAIR, value: valueMap[uniqueRanks[0]], length: 2 };
    if (cnt === 3) return { type: HandType.TRIPLE, value: valueMap[uniqueRanks[0]], length: 3 };
  }

  // Triple with single / pair
  if (len === 4 && uniqueRanks.length === 2) {
    const trio = uniqueRanks.find(r => counts[r] === 3);
    if (trio) {
      return {
        type: HandType.TRIPLE_WITH_SINGLE,
        value: valueMap[trio],
        length: 4,
      };
    }
  }
  if (len === 5 && uniqueRanks.length === 2) {
    const trio = uniqueRanks.find(r => counts[r] === 3);
    const pair = uniqueRanks.find(r => counts[r] === 2);
    if (trio && pair) {
      return {
        type: HandType.TRIPLE_WITH_PAIR,
        value: valueMap[trio],
        length: 5,
      };
    }
  }

  // Straight (>=5 singles, no rank >= '2')
  if (len >= 5 && uniqueRanks.every(r => counts[r] === 1 && valueMap[r] < valueMap['2'])) {
    const sorted = vals;
    if (sorted.every((v,i) => i === 0 || sorted[i] - sorted[i-1] === 1)) {
      return { type: HandType.STRAIGHT, value: sorted[0], length: len };
    }
  }

  // Double sequence (>=3 pairs)
  if (len >= 6 && len % 2 === 0 && uniqueRanks.every(r => counts[r] === 2 && valueMap[r] < valueMap['2'])) {
    const sorted = vals;
    if (sorted.every((v,i) => i === 0 || sorted[i] - sorted[i-1] === 1)) {
      return { type: HandType.DOUBLE_SEQUENCE, value: sorted[0], length: len };
    }
  }

  // Airplane and airplane with wings
  const triples = uniqueRanks.filter(r => counts[r] === 3 && valueMap[r] < valueMap['2'])
                              .sort((a,b)=>valueMap[a]-valueMap[b]);
  if (triples.length >= 2) {
    // 连续三张
    const triVals = triples.map(r=>valueMap[r]);
    if (triVals.every((v,i)=>i===0||triVals[i]-triVals[i-1]===1)) {
      const mainLen = triples.length * 3;
      if (len === mainLen) {
        return { type: HandType.AIRPLANE, value: triVals[0], length: len };
      }
      // 带翅膀： len === mainLen *2 或 mainLen + triples.length
      if (len === mainLen + triples.length) {
        return { type: HandType.AIRPLANE_WITH_WINGS, value: triVals[0], length: len };
      }
    }
  }

  // Four with two
  if (len === 6 && uniqueRanks.some(r=>counts[r]===4)) {
    return { type: HandType.FOUR_WITH_TWO, value: valueMap[uniqueRanks.find(r=>counts[r]===4)], length: 6 };
  }

  return { type: HandType.INVALID, value: 0, length: len };
}

/**
 * 判断 play 能否压过 current
 * @param {{type:string,value:number,length:number}} play
 * @param {{type:string,value:number,length:number}|null} current
 */
export function canPlay(play, current) {
  if (!current) return true;
  // Rocket 最大
  if (play.type === HandType.ROCKET) return true;
  if (current.type === HandType.ROCKET) return false;
  // Bomb beats非炸弹
  if (play.type === HandType.BOMB && current.type !== HandType.BOMB) return true;
  if (play.type === current.type && play.length === current.length) {
    return play.value > current.value;
  }
  // 同花炸弹比较
  if (play.type === HandType.BOMB && current.type === HandType.BOMB) {
    return play.value > current.value;
  }
  return false;
}