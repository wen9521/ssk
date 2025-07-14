// frontend/src/context/GameContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import webSocketService from '../services/websocketService';

export const GameContext = createContext();

export function useGame() {
    return useContext(GameContext);
}

// 在 Provider 外部定义一个稳定的空函数，避免在渲染中重复创建
const noOp = () => {};

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
    const [isMatching, setIsMatching] = useState(false);
    const [hand, setHand] = useState([]);
    const [doudizhuState, setDoudizhuState] = useState({ landlord: null, landlordCards: [], biddingState: null });

    const refreshRoomStatus = useCallback(async () => {
        if (!roomId) return;
        setIsLoading(true);
        setError(null);
        try {
            const statusData = await api.getRoomStatus(roomId);
            setPlayers(statusData.players || []);
            setRoomStatus(statusData.room.status || 'idle');
            setGameType(statusData.room.game_type || 'thirteen_water');

            const currentUser = statusData.players.find(p => p.user_id === userId);
            if (currentUser) {
                setIsCreator(currentUser.is_creator);
                if (currentUser.hand) setHand(JSON.parse(currentUser.hand));
            }
            
            if (statusData.room.game_type === 'doudizhu' && statusData.room.extra_data) {
                const extraData = JSON.parse(statusData.room.extra_data);
                if (statusData.room.status === 'bidding') {
                    setDoudizhuState(prevState => ({ ...prevState, biddingState: extraData }));
                } else if (['playing', 'finished'].includes(statusData.room.status)) {
                    setDoudizhuState(prevState => ({ ...prevState, landlord: extraData.landlord, landlordCards: extraData.landlordCards, biddingState: null }));
                }
            }
        } catch (err) {
            setError(`刷新状态失败: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [roomId, userId]);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            localStorage.setItem('userId', newUserId);
            setUserId(newUserId);
        }
    }, []);

    const handleWsMessage = useCallback(() => {
        // 当收到任何WebSocket消息时，我们都刷新状态以保持同步
        // 这是一个简单而健壮的策略
        refreshRoomStatus();
    }, [refreshRoomStatus]);

    useEffect(() => {
        webSocketService.addMessageListener(handleWsMessage);
        return () => webSocketService.removeMessageListener(handleWsMessage);
    }, [handleWsMessage]);
    
    const selectGameType = (type) => setGameType(type);
    
    const handleCancelMatchmaking = useCallback(async () => {
        if (!isMatching) return;
        try {
            await api.matchmaking('leave', userId);
        } catch (err) {
            console.error("取消匹配失败:", err.message);
        } finally {
            setIsMatching(false);
            setIsLoading(false);
        }
    }, [isMatching, userId]);
    
    const goBackToGameSelection = useCallback(() => {
        handleCancelMatchmaking();
        setGameType(null); 
        setRoomId(null); 
        setError(null); 
    }, [handleCancelMatchmaking]);

    const handleQuickPlay = useCallback(async () => {
        if (!gameType) { setError("请先选择游戏类型。"); return; }
        setIsLoading(true); setError(null);
        try {
            const data = await api.quickPlay(userId, gameType);
            setRoomId(data.roomId);
            navigate('/play');
        } catch (err) { setError(`创建试玩失败: ${err.message}`);
        } finally { setIsLoading(false); }
    }, [gameType, userId, navigate]);

    const handleMatchmaking = useCallback(async () => {
        if (!gameType) { setError("请先选择游戏类型。"); return; }
        setIsLoading(true); setError(null);
        try {
            await api.matchmaking('join', userId, gameType);
            setIsMatching(true);
        } catch (err) {
            setError(`加入匹配失败: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [gameType, userId]);

    useEffect(() => {
        if (!isMatching) return;
        const poller = setInterval(async () => {
            try {
                const data = await api.matchmaking('status', userId);
                if (data.status === 'matched') {
                    setIsMatching(false);
                    setRoomId(data.matched_room_id);
                    navigate('/play');
                }
            } catch (error) {
                console.error("轮询匹配状态失败:", error);
            }
        }, 3000);
        return () => clearInterval(poller);
    }, [isMatching, userId, navigate]);

    const handleBid = useCallback(async (bidValue) => {
        setIsLoading(true); setError(null);
        try {
            await api.bid(roomId, userId, bidValue);
            webSocketService.sendMessage({ type: 'game_update', message: `玩家 ${userId} 叫了 ${bidValue} 分` });
        } catch (err) { setError(`叫分失败: ${err.message}`);
        } finally { setIsLoading(false); }
    }, [roomId, userId]);

    const handlePlayCard = useCallback(async (cards) => {
        setIsLoading(true); setError(null);
        try {
            await api.playCard(roomId, userId, cards);
            webSocketService.sendMessage({ type: 'game_update', message: `玩家 ${userId} 出牌` });
        } catch (err) { setError(`出牌失败: ${err.message}`);
        } finally { setIsLoading(false); }
    }, [roomId, userId]);

    const value = {
        gameType, userId, roomId, players, roomStatus, isCreator, isLoading, error, isMatching,
        hand, doudizhuState,
        selectGameType, goBackToGameSelection, handleQuickPlay, handleMatchmaking, handleCancelMatchmaking,
        handleBid, handlePlayCard,
        refreshRoomStatus: roomStatus !== 'idle' ? refreshRoomStatus : noOp,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
