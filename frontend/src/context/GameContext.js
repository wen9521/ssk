// frontend/src/context/GameContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import webSocketService from '../services/websocketService';

const GameContext = createContext();

export function useGame() {
    return useContext(GameContext);
}

export function GameProvider({ children }) {
    const navigate = useNavigate();
    const [gameType, setGameType] = useState(null);
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [players, setPlayers] = useState([]);
    const [roomStatus, setRoomStatus] = useState('idle');
    const [isCreator, setIsCreator] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isMatching, setIsMatching] = useState(false); // 新增：是否正在匹配中
    
    // ... 其他 state 不变 ...
    const [lastWsMessage, setLastWsMessage] = useState(null);
    const [hand, setHand] = useState([]);
    const [doudizhuState, setDoudizhuState] = useState({ landlord: null, landlordCards: [], biddingState: null });


    const refreshRoomStatus = useCallback(async () => { /* ... (无变化) ... */ }, [roomId, userId]);

    useEffect(() => { /* ... (无变化) ... */ }, []);

    const handleWsMessage = useCallback((message) => { /* ... (无变化) ... */ }, [refreshRoomStatus]);

    useEffect(() => { /* ... (无变化) ... */ }, [handleWsMessage]);
    
    const selectGameType = (type) => setGameType(type);
    const goBackToGameSelection = () => {
        handleCancelMatchmaking(); // 返回时确保取消匹配
        setGameType(null); 
        setRoomId(null); 
        setError(null); 
    };

    const handleQuickPlay = async () => {
        if (!gameType) { setError("请先选择游戏类型。"); return; }
        setIsLoading(true); setError(null);
        try {
            const data = await api.quickPlay(userId, gameType);
            setRoomId(data.roomId);
            await refreshRoomStatus(); // 获取一次状态
            navigate('/play');
        } catch (err) { setError(`创建试玩失败: ${err.message}`);
        } finally { setIsLoading(false); }
    };

    // --- 全新的自动匹配处理逻辑 ---
    const handleMatchmaking = async () => {
        if (!gameType) { setError("请先选择游戏类型。"); return; }
        setIsLoading(true); setError(null);
        try {
            await api.matchmaking('join', userId, gameType);
            setIsMatching(true); // 开始匹配状态
        } catch (err) {
            setError(`加入匹配失败: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelMatchmaking = async () => {
        if (!isMatching) return;
        try {
            await api.matchmaking('leave', userId);
        } catch (err) {
            console.error("取消匹配失败:", err.message); // 取消失败不强提示用户
        } finally {
            setIsMatching(false); // 停止匹配状态
            setIsLoading(false);
        }
    };

    // --- 匹配状态轮询器 ---
    useEffect(() => {
        if (!isMatching) return;

        const poller = setInterval(async () => {
            try {
                const data = await api.matchmaking('status', userId);
                if (data.status === 'matched') {
                    setIsMatching(false); // 匹配成功，停止轮询
                    setRoomId(data.matched_room_id);
                    await refreshRoomStatus(); // 刷新一下房间状态
                    navigate('/play'); // 跳转到游戏
                }
                // 如果是 'waiting' 或 'not_in_queue'，则继续轮询
            } catch (error) {
                console.error("轮询匹配状态失败:", error);
                // 连续多次失败后可以考虑停止轮询并提示用户
            }
        }, 3000); // 每3秒查询一次

        return () => clearInterval(poller); // 组件卸载或停止匹配时清除定时器
    }, [isMatching, userId, navigate, refreshRoomStatus]);


    // --- 游戏内API调用 (bid, playCard等) 保持不变 ---
    const handleBid = async (bidValue) => { /* ... */ };
    const handlePlayCard = async (cards) => { /* ... */ };


    const value = {
        // ... (所有 state)
        gameType, userId, roomId, players, roomStatus, isCreator, isLoading, error, lastWsMessage,
        hand, doudizhuState, isMatching,
        // ... (所有函数)
        selectGameType, goBackToGameSelection,
        handleQuickPlay,
        handleMatchmaking,
        handleCancelMatchmaking, // 新增
        handleBid,
        handlePlayCard,
        refreshRoomStatus,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
