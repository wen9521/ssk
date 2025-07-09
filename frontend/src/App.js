import React, { useState } from 'react';
import Hand from './components/Hand';
import usePollingGameState from './hooks/usePollingGameState';
import ArrangeArea from './components/ArrangeArea'; // 修复了路径
// import TryPlay from './components/PokerTable'; // PokerTable 组件未被使用，可以注释或删除
import { createDeck, shuffleDeck } from './utils/cardUtils.js'; // 修复了路径
import { arrangeCardsForAI } from './utils/aiPlayer.js';
import { compareDuns } from './utils/compareCards.js'; // Import compareDuns

const FRONTEND_DOMAIN = "https://kk.wenge.ip-ddns.com"; // 您的前端域名
const BACKEND_DOMAIN = "https://9525.ip-ddns.com";    // 您的后端域名

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState(null); // 初始为 null
  const [joined, setJoined] = useState(false);
  const [playersCount, setPlayersCount] = useState(4);
  const [msg, setMsg] = useState('');
  const [isTryingPlay, setIsTryingPlay] = useState(false);
  const [playerDuns, setPlayerDuns] = useState(null); // 试玩模式下所有玩家的牌墩
  const [humanPlayerHand, setHumanPlayerHand] = useState([]); // 试玩模式下人类玩家的初始手牌
  
  const gameState = usePollingGameState(roomId, isTryingPlay ? null : 1500); // 试玩模式下停止轮询

  // 创建房间
  const createRoom = async () => {
    try {
      setMsg("正在创建房间...");
      const res = await fetch(`${BACKEND_DOMAIN}/api/create-room.php`, { method: "POST" });
      const data = await res.json();
      if (data.room_id) {
        setRoomId(data.room_id);
        setPlayerIdx('0');
        setJoined(true);
        setMsg(`房间已创建，等待其他玩家加入。房间号: ${data.room_id}`);
      } else {
        setMsg("创建房间失败，请重试。");
      }
    } catch (error) {
      setMsg("网络错误，创建房间失败。");
    }
  };

  // 加入房间
  const joinRoom = async () => {
    if (!roomId) return setMsg("请输入房间号");
    try {
      setMsg("正在加入房间...");
      const res = await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${roomId}`, { method: "POST" });
      const data = await res.json();
      if (data.error) return setMsg(data.error);
      
      setPlayerIdx(data.player_idx.toString());
      setJoined(true);
      setMsg(`成功加入房间，你是座位 ${data.player_idx}。等待房主发牌。`);
    } catch (error) {
      setMsg("网络错误，加入房间失败。");
    }
  };

  // 试玩：一键创建房间+自己+3个AI
  const tryPlay = async () => {
    setIsTryingPlay(true);
    setJoined(true);
    setMsg('欢迎来到试玩模式！请理牌。');
    setPlayerIdx('0');

    // 前端直接发牌
    const deck = createDeck();
    const shuffledDeck = shuffleDeck(deck);
    const allPlayersDuns = Array(4).fill(null); // 初始化所有玩家的牌墩为null
    let currentDeck = [...shuffledDeck];

    for (let i = 0; i < playersCount; i++) {
      const playerHand = currentDeck.splice(0, 13);
      if (i === 0) {
        setHumanPlayerHand(playerHand); // 存储人类玩家的初始手牌
      } else {
        // 使用简单的AI理牌逻辑 (aiPlayer.js)
        allPlayersDuns[i] = arrangeCardsForAI(playerHand);
      }
    }
    setPlayerDuns(allPlayersDuns); // 设置所有玩家的牌墩初始状态
  };

  // 开始游戏 (仅限联机模式)
  const startGame = async () => {
    setMsg("正在发牌...");
    await fetch(`${BACKEND_DOMAIN}/api/start-game.php`, {
      method: 'POST', // 明确指定POST方法
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `room_id=${roomId}&player_count=${playersCount}` // 确保 player_count 被传递
    });
    setMsg("已发牌！请理牌。");
  };

  // 提交理牌 (统一处理试玩和联机模式)
  const submitDun = async (duns) => {
    // 试玩模式: 直接更新前端状态并进行前端比牌
    if (isTryingPlay) {
      const newPlayerDuns = [...playerDuns];
      newPlayerDuns[playerIdx] = duns; // duns 的格式应为 {dun1, dun2, dun3}
      setPlayerDuns(newPlayerDuns);
      setMsg("理牌已提交！正在前端进行比牌...");

      // 前端比牌逻辑
      const humanDuns = duns;
      let comparisonMsg = "比牌结果：\n";
      for (let aiPlayerIndex = 1; aiPlayerIndex <= 3; aiPlayerIndex++) {
        if (newPlayerDuns[aiPlayerIndex]) {
          const aiDuns = newPlayerDuns[aiPlayerIndex];
          const headResult = compareDuns(humanDuns.dun1, aiDuns.dun1);
          const middleResult = compareDuns(humanDuns.dun2, aiDuns.dun2);
          const tailResult = compareDuns(humanDuns.dun3, aiDuns.dun3);
          comparisonMsg += `你 vs AI${aiPlayerIndex}: 头墩(${headResult}), 中墩(${middleResult}), 尾墩(${tailResult})\n`;
        }
      }
      console.log(comparisonMsg); // 在控制台输出详细比牌结果
      setMsg("比牌完成！详情请查看控制台。");
    }
    // 联机模式: 发送数据到后端
    else {
      setMsg("正在提交理牌结果...");
      await fetch(`${BACKEND_DOMAIN}/api/set-dun.php`, {
        method: "POST",
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: `room_id=${roomId}&player_idx=${playerIdx}&dun=${encodeURIComponent(JSON.stringify(duns))}`
      });
      setMsg("理牌已提交，等待其他玩家...");
    }
  };

  // 根据模式选择要显示的手牌/牌墩
  const myPlayer = gameState && gameState.players && gameState.players[playerIdx] ? gameState.players[playerIdx] : null;
  const myHand = isTryingPlay ? humanPlayerHand : (myPlayer?.hand || []);
  const allPlayers = isTryingPlay 
    ? Array(playersCount).fill({}).map((_, i) => ({
        dun: playerDuns?.[i] || null, // 显示AI和玩家的牌墩
        hand: i.toString() === playerIdx ? humanPlayerHand : [] // 只显示自己的手牌
      }))
    : (gameState?.players || []);
  
  // 判断是否轮到我理牌
  const showArrangeArea = (
    (isTryingPlay && myHand.length === 13 && !playerDuns?.[playerIdx]) ||
    (!isTryingPlay && myPlayer?.hand?.length === 13 && !myPlayer?.dun)
  );
  
  const getPlayerName = (idx) => {
    if (isTryingPlay) {
        return idx.toString() === playerIdx ? "你 (试玩)" : `AI ${idx}`;
    }
    return idx.toString() === playerIdx ? `你 (座位${idx})` : `玩家 ${idx}`;
  };

  return (
    <div style={{ padding: 20, maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2>十三水多人房间游戏</h2>
      
      {!joined ? (
        <div>
          <button onClick={createRoom}>创建房间</button>
          <button onClick={tryPlay} style={{marginLeft: 8}}>单机试玩</button>
          <div style={{ margin: "10px 0" }}>
            <input placeholder="输入房间号加入" value={roomId} onChange={e=>setRoomId(e.target.value)} />
            <button onClick={joinRoom}>加入房间</button>
          </div>
        </div>
      ) : (
        <div>
          <div>房间号: {roomId || '试玩模式'}</div>
          {playerIdx !== null && <div>你的座位号: {playerIdx}</div>}
          {!isTryingPlay && playerIdx === '0' && (
            <button onClick={startGame} disabled={gameState?.players.length < 2}>发牌</button>
          )}
        </div>
      )}

      <div style={{color: "red", marginTop: '10px', minHeight: '20px'}}>{msg}</div>
      <hr />

      {joined && (
        <div>
          <h3>玩家列表与状态</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
            {allPlayers.map((p, idx) => (
              <div key={`player-${idx}`}>
                <b>{getPlayerName(idx)}:</b>
                {p.dun ? (
                  <div>
                    <div>头墩: <Hand hand={p.dun.dun1} /></div>
                    <div>中墩: <Hand hand={p.dun.dun2} /></div>
                    <div>尾墩: <Hand hand={p.dun.dun3} /></div>
                  </div>
                ) : (
                  (idx.toString() === playerIdx && p.hand?.length > 0) 
                  ? <span>已发牌，等待理牌...</span> 
                  : <span>等待中...</span>
                )}
              </div>
            ))}
          </div>
          
          {showArrangeArea && (
            <div>
              <hr style={{ margin: '20px 0' }} />
              <h3>请理牌</h3>
              <ArrangeArea hand={myHand} onSubmit={submitDun} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
