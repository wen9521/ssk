import React from 'react';
import { useState, useEffect } from 'react';
import usePollingGameState from './hooks/usePollingGameState';
import PokerTable from './components/game/PokerTable';
import { createDeck, shuffleDeck } from './utils/game/cardUtils.js';
import { aiSmartSplit } from './utils/ai/SmartSplit.js';
import { calcSSSAllScores } from './utils/game/sssScore.js'; // 修复路径

const BACKEND_DOMAIN = "https://9525.ip-ddns.com";

export default function App() {
  // ...文件其余部分保持不变...
}