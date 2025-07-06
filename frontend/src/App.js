import React, { useState } from 'react';
import Hand from './components/Hand';
import usePollingGameState from './hooks/usePollingGameState';
import ArrangeArea from './components/ArrangeArea';
import TryPlay from './components/PokerTable';

const FRONTEND_DOMAIN = "https://kk.wenge.ip-ddns.com";
const BACKEND_DOMAIN = "https://9525.ip-ddns.com";

export default function App() {
  const [roomId, setRoomId] = useState('');
  const [playerIdx, setPlayerIdx] = useState('');
  const [joined, setJoined] = useState(false);
  const [playersCount, setPlayersCount] = useState(4);
  const [msg, setMsg] = useState('');
  const [isTryingPlay, setIsTryingPlay] = useState(false);
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
    await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${newRoomId}`, { method: "POST" });
    await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${newRoomId}`, { method: "POST" });
    await fetch(`${BACKEND_DOMAIN}/api/join-room.php?room_id=${newRoomId}`, { method: "POST" });

    // 4. 发牌
    await fetch(`${BACKEND_DOMAIN}/api/start-game.php`, {
      method: "POST",
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `room_id=${newRoomId}&player_count=4`
    });
    setMsg("试玩房间已准备好，可以理牌！");
    setIsTryingPlay(true);
  };

  // 发牌
  const startGame = async () => {
    await fetch(`${BACKEND_DOMAIN}/api/start-game.php`, {
      method: "POST",
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `room_id=${roomId}&player_count=${playersCount}`
    });
    setMsg("已发牌！");
  };

  // 提交理牌
  const submitDun = async (duns) => {
    await fetch(`${BACKEND_DOMAIN}/api/set-dun.php`, {
      method: "POST",
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: `room_id=${roomId}&player_idx=${playerIdx}&dun=${encodeURIComponent(JSON.stringify(duns))}`
    });
    setMsg("理牌已提交！");
  };

  // 当前玩家理牌状态
  const myPlayer = gameState && gameState.players && gameState.players[playerIdx] ? gameState.players[playerIdx] : null;

  // AI名称映射
  const getPlayerName = idx =>
    idx === 0 ? "你" : `AI${idx}`;

  return (
    <div style={{ padding: 20 }}>
      {isTryingPlay ? (
        <TryPlay />
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
              <div key={idx}>
                {getPlayerName(idx)}: <Hand hand={p.hand} />
              </div>
            ))}
          </div>
          {/* 理牌区 */}
          {joined && myPlayer && myPlayer.hand && myPlayer.hand.length === 13 && !myPlayer.dun && (
            <>
              <h3>理牌区</h3>
              <ArrangeArea hand={myPlayer.hand} onSubmit={submitDun} />
            </>
          )}
          {/* 展示各玩家牌墩 */}
          <hr />
          <h3>各玩家牌墩</h3>
          <div>
            {gameState && gameState.players.map((p, idx) => (
              <div key={idx}>
                {getPlayerName(idx)}：
                {p.dun ? p.dun.map((dun, i) => (
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
