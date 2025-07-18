import { SUITS, VALUES } from '../constants.js';
import { parseCardFilename } from '../services/card-parser.js';

// 生成一副完整扑克牌的文件名列表
function generateFullDeckFiles() {
    const files = [];
    for (const suitKey in SUITS) {
        for (const valueKey in VALUES) {
            files.push(`${valueKey}_of_${suitKey}.svg`);
        }
    }
    files.push('red_joker.svg');
    files.push('black_joker.svg');
    return files;
}

export const FULL_DECK_FILES = generateFullDeckFiles();

// 创建一副完整的、解析好的牌组
export function createDeck() {
    return FULL_DECK_FILES.map(file => parseCardFilename(file));
}

// 洗牌 (Fisher-Yates shuffle algorithm)
export function shuffle(deck) {
    let currentIndex = deck.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
    }
    return deck;
}
