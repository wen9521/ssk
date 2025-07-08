import React, { useState } from 'react';
import Hand from './components/Hand';
import usePollingGameState from './hooks/usePollingGameState';
import ArrangeArea from '/home/runner/work/ssk/ssk/frontend/src/components/ArrangeArea.js';
import TryPlay from './components/PokerTable';
import { createDeck, shuffleDeck } from '/home/runner/work/ssk/ssk/frontend/src/utils/cardUtils.js';
import { arrangeCardsForAI } from '/home/runner/work/ssk/ssk/frontend/src/utils/aiPlayer.js';
import { compareDuns } from '/home/runner/work/ssk/ssk/frontend/src/utils/compareCards.js'; // Import compareDuns
const FRONTEND_DOMAIN = "https://kk.wenge.ip-ddns.com";
const BACKEND_DOMAIN = "https://9525.ip-ddns.com";

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState('');
  const [joined, setJoined] = useState(false);
  const [playersCount, setPlayersCount] = useState(4);
  const [msg, setMsg] = useState('');
  const [isTryingPlay, setIsTryingPlay] = useState(false);
  const [playerDuns, setPlayerDuns] = useState(null); // New state for player duns in try play
  const [humanPlayerHand, setHumanPlayerHand] = useState([]); // State for human player's initial hand in try play
  const gameState = usePollingGameState(roomId);

  // 创建房间
  const createRoom = async () => {
    const res = await fetch(`${BACKEND_DOMAIN}/api/create-room.php`, { method: "POST" });
    const data = await res.json();
    setRoomId(data.room_id);
    setPlayerIdx('0');
    setJoined(true);
    setMsg("房间已创建，等待其他玩家加入。房间号: " + data.room_id);
  };

  // 加入房间
  const joinRoom = async () => {
    if (!roomId) return setMsg("请输入房间号");
    const res = await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${roomId}`, { method: "POST" });
    const data = await res.json();
    if (data.error) return setMsg(data.error);
    setPlayerIdx(data.player_idx);
    setJoined(true);
    setMsg("加入房间成功，等待发牌。 你是座位：" + data.player_idx);
  };

  // 试玩：一键创建房间+自己+3个AI
  const tryPlay = async () => {
    setMsg('正在创建试玩房间...');
    // 1. 创建房间
    const res = await fetch(`${BACKEND_DOMAIN}/api/create-room.php`, { method: "POST" });
    const data = await res.json();
    if (!data.room_id) return setMsg("创建房间失败");
    const newRoomId = data.room_id;
    setRoomId(newRoomId);
    setPlayersCount(4);

    // 2. 你自己加入
    const res2 = await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${newRoomId}`, { method: "POST" });
    const d2 = await res2.json();
    setPlayerIdx('0');
    setJoined(true);

    // 3. AI加入（3次）
    // Removed backend AI join calls

    // 4. 前端发牌 for try play
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const allPlayersDuns = Array(4).fill(null); // Initialize duns array for all players
    let currentDeck = [...shuffledDeck]; // Use a copy to deal cards from

    for (let i = 0; i < playersCount; i++) { // Use playersCount for flexibility
      const playerHand = currentDeck.splice(0, 13);
      if (i === 0) {
        setHumanPlayerHand(playerHand); // Store human player's initial hand
      } else {
        // Assuming you have arrangeCardsForAI in ./utils/aiPlayer.js
        allPlayersDuns[i] = arrangeCardsForAI(playerHand); // AI arranges cards immediately
      }
    }

 setPlayerDuns(allPlayersDuns); // Set initial state for all players' duns (AI are arranged);
 setIsTryingPlay(true); // Set isTryingPlay to true at the end
  };
  const startGame = async () => {
    await fetch(`${BACKEND_DOMAIN}/api/start-game.php`, {
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `room_id=${roomId}&player_count=${playersCount}`
    });
    setMsg("已发牌！");
  };

  // 提交理牌
  const submitDun = async (duns) => {
    // In try play mode, update frontend state directly
    if (isTryingPlay) {
      const newPlayerDuns = [...playerDuns];
      newPlayerDuns[playerIdx] = duns;
      setPlayerDuns(newPlayerDuns);
      setMsg("理牌已提交！");
      // Start comparison logic in try play mode
      const humanDuns = duns; // Your submitted duns
      for (let aiPlayerIndex = 1; aiPlayerIndex <= 3; aiPlayerIndex++) {
        const aiDuns = playerDuns[aiPlayerIndex];
        // Compare duns
        const headResult = compareDuns(humanDuns.dun1, aiDuns.dun1, 'head');
        const middleResult = compareDuns(humanDuns.dun2, aiDuns.dun2, 'middle');
        const tailResult = compareDuns(humanDuns.dun3, aiDuns.dun3, 'tail');

        // Log comparison results for this AI player
        console.log(`Vs AI ${aiPlayerIndex}: Head Dun: ${headResult}, Middle Dun: ${middleResult}, Tail Dun: ${tailResult}`);
        // Comparison logic will be added here
      }
    }
    // In normal multiplayer mode, send to backend
    await fetch(`${BACKEND_DOMAIN}/api/set-dun.php`, {
      method: "POST",
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `room_id=${roomId}&player_idx=${playerIdx}&dun=${encodeURIComponent(JSON.stringify(duns))}`
    });
  };

  // In try play mode, myPlayer hand comes from playerDuns state
  // In try play, the hand is the initial hand for arrangement
  // In normal multiplayer mode, it comes from gameState.
  // After arrangement in try play, the duns are in playerDuns state.
  const myHandForArrange = isTryingPlay ? humanPlayerHand : (myPlayer?.hand || []);
  const displayedDuns = isTryingPlay ? playerDuns : (gameState?.players || []).map(p => p.dun);
  const myPlayer = gameState && gameState.players && gameState.players[playerIdx] ? gameState.players[playerIdx] : null;

  // AI名称映射
  const getPlayerName = idx =>
    idx === 0 ? "你" : `AI${idx}`;

  return (
    <div style={{ padding: 20 }}>
      {isTryingPlay ? (
        null // Hide other UI elements in try play for now
      ) : (
        <div>
          <h2>十三水多人房间游戏</h2>
          {!joined ? (
            <div>
              <button onClick={createRoom}>创建房间</button>
              <button onClick={tryPlay} style={{marginLeft:8}}>试玩（和3个AI玩）</button>
              <div style={{ margin: "10px 0" }}>
                <input placeholder="房间号" value={roomId} onChange={e=>setRoomId(e.target.value)} />
                <button onClick={joinRoom}>加入房间</button>
              </div>
            </div>
          ) : (
            <div>
              <div>房间号: {roomId}</div>
              <div>你的座位号: {playerIdx}</div>
              <button onClick={startGame}>发牌</button>
            </div>
          )}
          <div style={{color:"red"}}>{msg}</div>
          <hr />
          <h3>玩家手牌</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {gameState && gameState.players && gameState.players.map((p, idx) => (
              <div key={`hand-${idx}`}>
                {getPlayerName(idx)}: {isTryingPlay && idx === 0 ? "已发牌" : <Hand hand={p.hand} />} {/* Only show "已发牌" for human in try play */}
              </div>
            ))}
          </div>
          {/* 理牌区 */}
          {isTryingPlay && humanPlayerHand.length === 13 && !playerDuns?.[playerIdx]?.dun && (
            <div> {/* Wrap content with a div */}
              <h3>你的手牌 (请理牌)</h3>
              <ArrangeArea hand={humanPlayerHand} onSubmit={(duns) => {
                const newPlayerDuns = [...playerDuns]; newPlayerDuns[playerIdx] = duns; setPlayerDuns(newPlayerDuns); setMsg("理牌已提交！"); // Added semicolons
              }} />
            </div> {/* Close the div */}
          )}
          {/* 展示各玩家牌墩 */}
          <hr />
          <h3>各玩家牌墩</h3>
          <div>
            {gameState && gameState.players.map((p, idx) => (
              <div key={idx}>
                {getPlayerName(idx)}：
                {displayedDuns?.[idx] ? displayedDuns[idx].map((dun, i) => (
                  <span key={i}>
                    [{dun && dun.length > 0 ? dun.join(', ') : ''}]
                  </span>
                )) : '未提交'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
