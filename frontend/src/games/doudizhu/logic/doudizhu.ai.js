// frontend/src/games/doudizhu/logic/doudizhu.ai.js
import { parseHand, canPlay, हैंड_टाइप } from './doudizhu.rules';

// ... (rest of the file remains unchanged) ...

function findPossiblePlays(hand, lastPlay) {
  const plays = [];
  
  // Corrected to use the imported constant
  if (!lastPlay || lastPlay.type === हैंड_टाइप.SINGLE) { 
    for (const card of hand) {
      const play = parseHand([card]);
      if (canPlay(play, lastPlay)) {
        plays.push([card]);
      }
    }
  }
  
  return plays.sort((a, b) => parseHand(a).value - parseHand(b).value);
}
