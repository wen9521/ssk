import { SUITS, VALUES } from '../constants.js';

export function parseCardFilename(filename) {
    if (!filename) return null;
    const nameOnly = filename.replace('.svg', '');

    if (nameOnly === 'red_joker') {
        return { id: filename, type: 'joker', name: '大王', fullName: '大王', rank: 99 };
    }
    if (nameOnly === 'black_joker') {
        return { id: filename, type: 'joker', name: '小王', fullName: '小王', rank: 98 };
    }

    const parts = nameOnly.split('_of_');
    if (parts.length !== 2) return null;

    const valueKey = parts[0];
    const suitKey = parts[1];
    const valueInfo = VALUES[valueKey];
    const suitInfo = SUITS[suitKey];

    if (!valueInfo || !suitInfo) return null;

    return {
        id: filename,
        type: 'normal',
        suit: { key: suitKey, ...suitInfo },
        value: { key: valueKey, ...valueInfo },
        fullName: `${suitInfo.name}${valueInfo.name}`,
        rank: valueInfo.rank
    };
}
