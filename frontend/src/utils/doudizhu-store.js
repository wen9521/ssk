// src/utils/doudizhu-store.js
import { create } from 'zustand';
import { produce } from 'immer';
import { createDeck, shuffleDeck } from '@/game-logic/deck';
import { JokerRanks, parseHand, canPlay, valueMap } from '@/game-logic/doudizhu-rules';
import { decideBid, decidePlay } from '@/game-logic/doudizhu-ai';

export const DoudizhuStage = {
  BIDDING: 'BIDDING',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
};

// 完整的牌组，包含大小王
const createDoudizhuDeck = () => {
    const standardDeck = createDeck();
    standardDeck.push({ rank: JokerRanks.BLACK_JOKER, suit: 'joker' });
    standardDeck.push({ rank: JokerRanks.RED_JOKER, suit: 'joker' });
    return standardDeck;
};

const getNextPlayerId = (currentId) => {
  const numId = parseInt(currentId.replace('player', ''), 10);
  const nextNum = numId === 3 ? 1 : numId + 1;
  return `player${nextNum}`;mekashi

print(default_api.read_file(path="frontend/src/game-logic/doudizhu-rules.js"))
print(default_api.read_file(path="frontend/src/game-logic/doudizhu-ai.js"))
mekashi
