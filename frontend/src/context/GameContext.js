// frontend/src/context/GameContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import webSocketService from '../services/websocketService';

const GameContext = createContext();

export function useGame() {
    return useContext(GameContext);
}

export function GameProvider({ children }) {
    // ... (所有 state 定义保持不变) ...
    const [gameType, setGameType] = useState(null);
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [players, setPlayers] = useState([]);
    const [roomStatus, setRoomStatus] = useState('idle');
    const [isCreator, setIsCreator] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastWsMessage, setLastWsMessage] = useState(null);
    const [hand, setHand] = useState([]);
    const [doudizhuState, setDoudizhuState] = useState({
        landlord: null,
        landlordCards: [],
        biddingState: null,
    });


    // ... (useEffect 和大部分函数保持不变) ...
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) setUserId(storedUserId);
        else {
            const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            localStorage.setItem('userId', newUserId);
            setUserId(newUserId);
        }
    }, []);

    const handleWsMessage = useCallback((message) => {
        setLastWsMessage(message);
        if (message.type === 'game_update' || message.sender) {
            refreshRoomStatus();
        }
    }, []);

    useEffect(() => {
        webSocketService.addMessageListener(handleWsMessage);
        return () => webSocketService.removeMessageListener(handleWsMessage);
    }, [handleWsMessage]);
    
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
                } else if (statusData.room.status === 'playing' || statusData.room.status === 'finished') {
                    setDoudizhuState(prevState => ({ ...prevState, landlord: extraData.landlord, landlordCards: extraData.landlordCards, biddingState: null }));
                }
            }
            return true;
        } catch (err) {
            setError(`刷新状态失败: ${err.message}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [roomId, userId]);

    const selectGameType = (type) => setGameType(type);
    const goBackToGameSelection = () => { setGameType(null); setRoomId(null); setError(null); };

    const handleCreateRoom = async () => { /* ... */ 
        if (!gameType) { setError("请先选择一个游戏类型。"); return false; }
        setIsLoading(true); setError(null);
        try {
            const data = await api.createRoom(userId, gameType); 
            setRoomId(data.roomId);
            await refreshRoomStatus();
            return true;
        } catch (err) { setError(`创建房间失败: ${err.message}`); return false;
        } finally { setIsLoading(false); }
    };
    const handleJoinRoom = async (newRoomId) => { /* ... */
        setIsLoading(true); setError(null);
        try {
            await api.joinRoom(newRoomId, userId);
            setRoomId(newRoomId);
            return await refreshRoomStatus();
        } catch (err) { setError(`加入房间失败: ${err.message}`); return false;
        } finally { setIsLoading(false); }
    };
    const handleStartGame = async () => { /* ... */
        setIsLoading(true); setError(null);
        try {
            await api.startGame(roomId, userId);
            await refreshRoomStatus();
            webSocketService.sendMessage({ type: 'game_update', message: '游戏已开始' });
            return true;
        } catch (err) { setError(`开始游戏失败: ${err.message}`); return false;
        } finally { setIsLoading(false); }
    };
    
    const handleBid = async (bidValue) => { /* ... */
        setIsLoading(true);
setError(null);
        try {
            await api.bid(roomId, userId, bidValue);
            await refreshRoomStatus();
            webSocketService.sendMessage({ type: 'game_update', message: `玩家 ${userId} 叫了 ${bidValue} 分` });
        } catch (err) {
            setError(`叫分失败: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 新增：处理出牌的函数 ---
    const handlePlayCard = async (cards) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.playCard(roomId, userId, cards);
            await refreshRoomStatus();
            // 触发WebSocket通知
            webSocketService.sendMessage({ type: 'game_update', message: `玩家 ${userId} 出牌` });
        } catch (err) {
            setError(`出牌失败: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { /* ... */
        if (roomId && userId) { webSocketService.connect(roomId, userId); }
        return () => { if (webSocketService.socket) webSocketService.disconnect(); };
    }, [roomId, userId]);

    useEffect(() => { /* ... */
        if (roomId && (roomStatus === 'waiting' || roomStatus === 'full' || roomStatus === 'bidding' || roomStatus === 'playing')) {
            const interval = setInterval(refreshRoomStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [roomId, roomStatus, refreshRoomStatus]);

    const value = {
        // ... (所有旧的值)
        gameType, userId, roomId, players, roomStatus, isCreator, isLoading, error, lastWsMessage,
        hand, doudizhuState,
        selectGameType, goBackToGameSelection, handleCreateRoom, handleJoinRoom, handleStartGame,
        handleBid,
        // 新增 handlePlayCard
        handlePlayCard,
        refreshRoomStatus,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
