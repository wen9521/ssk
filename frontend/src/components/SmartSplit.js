// frontend/src/components/SmartSplit.js
import React, { useState } from 'react';
import Card from './Card';
import './styles/SmartSplit.css';
import { setDun } from '../services/apiService';
// 导入游戏核心逻辑以实现智能分牌
import { autoArrangeCards as arrangeCards } from '../gameLogic/thirteenWater';

// --- 新增的导出函数 ---

/**
 * AI 智能分牌逻辑
 * @param {string[]} hand - 13张手牌
 * @returns {object} - { front, middle, back }
 */
export const aiSmartSplit = (hand) => {
    // 直接复用项目中已有的十三水游戏逻辑
    return arrangeCards(hand);
};

/**
 * 获取玩家的智能分牌建议
 * @param {string[]} hand - 13张手牌
 * @returns {Array<object>} - 返回一个包含建议方案的数组
 */
export const getPlayerSmartSplits = (hand) => {
    // 简化实现：目前只返回一种AI推荐的方案
    const bestSplit = arrangeCards(hand);
    return [bestSplit]; // 以数组形式返回，以兼容未来扩展多种方案
};


// --- 原有的 React 组件保持不变 ---

const SmartSplit = ({ playerHand, roomId, userId, onDunSet }) => {
    // 初始手牌区
    const [sourceHand, setSourceHand] = useState([...playerHand]);
    
    // 三墩牌区
    const [frontDun, setFrontDun] = useState([]);
    const [middleDun, setMiddleDun] = useState([]);
    const [backDun, setBackDun] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const dunConfig = {
        front: { name: '前墩', size: 3, cards: frontDun, set: setFrontDun },
        middle: { name: '中墩', size: 5, cards: middleDun, set: setMiddleDun },
        back: { name: '后墩', size: 5, cards: backDun, set: setBackDun },
    };

    /**
     * 将牌从一个区域移动到另一个区域
     * @param {string} card - 要移动的牌
     * @param {string} from - 来源区域 ('source', 'front', 'middle', 'back')
     * @param {string} to - 目标区域
     */
    const moveCard = (card, from, to) => {
        // 从来源区域移除
        if (from === 'source') {
            setSourceHand(prev => prev.filter(c => c !== card));
        } else {
            dunConfig[from].set(prev => prev.filter(c => c !== card));
        }

        // 添加到目标区域
        if (to === 'source') {
            setSourceHand(prev => [...prev, card]);
        } else {
            // 检查目标墩是否已满
            if (dunConfig[to].cards.length < dunConfig[to].size) {
                dunConfig[to].set(prev => [...prev, card]);
            } else {
                // 如果目标墩已满，将牌放回原手牌区
                setSourceHand(prev => [...prev, card]);
            }
        }
    };

    // 提交理牌结果
    const handleSubmitDun = async () => {
        if (frontDun.length !== 3 || middleDun.length !== 5 || backDun.length !== 5) {
            setError("请将所有牌墩都摆满后再提交。");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const hands = {
                front: frontDun,
                middle: middleDun,
                back: backDun
            };
            await setDun(roomId, userId, hands);
            console.log("牌组提交成功！");
            onDunSet(); // 通知父组件，该玩家已完成理牌
        } catch (err) {
            setError(err.message || "提交失败，请重试。");
            console.error("提交牌组失败:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="smart-split-container">
            <h2>请开始理牌</h2>
            
            {/* 三墩牌区 */}
            {Object.keys(dunConfig).map(dunKey => (
                <div key={dunKey} className="dun-area-wrapper">
                    <label>{dunConfig[dunKey].name} ({dunConfig[dunKey].cards.length}/{dunConfig[dunKey].size})</label>
                    <div className="dun-area" id={`dun-${dunKey}`}>
                        {dunConfig[dunKey].cards.map(card => (
                            <Card key={card} cardName={card} onClick={() => moveCard(card, dunKey, 'source')} />
                        ))}
                    </div>
                </div>
            ))}

            <hr />

            {/* 初始手牌区 */}
            <div className="source-hand-wrapper">
                <label>你的手牌</label>
                <div className="source-hand-area">
                    {sourceHand.map(card => (
                        <div key={card} className="card-in-source">
                            <Card cardName={card} />
                            <div className="dun-selectors">
                                <button onClick={() => moveCard(card, 'source', 'front')}>前</button>
                                <button onClick={() => moveCard(card, 'source', 'middle')}>中</button>
                                <button onClick={() => moveCard(card, 'source', 'back')}>后</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="actions">
                <button onClick={() => { /* TODO: 实现AI自动理牌 */ }}>自动理牌 (AI)</button>
                <button onClick={handleSubmitDun} disabled={isLoading}>
                    {isLoading ? '提交中...' : '确认提交牌组'}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default SmartSplit;
