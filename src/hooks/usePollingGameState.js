jsx
import { useEffect, useState } from 'react';

export default function usePollingGameState(roomId, interval = 1500) {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    let timer = null;

    const fetchState = async () => {
      try {
        const res = await fetch(`https://9525.ip-ddns.com/api/get-status.php?room_id=${roomId}`);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        // 检查数据有效性
        if (data && data.players) {
          setGameState(data);
        }
      } catch (error) {
        console.error('获取游戏状态失败:', error);
      }
    };

    fetchState();
    timer = setInterval(fetchState, interval);

    return () => clearInterval(timer);
  }, [roomId, interval]);

  return gameState;
}