// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect } from 'react';
import './styles/SpotTheDifference.css';

// 这是一个辅助组件，用于显示加载或错误状态
const GameStateDisplay = ({ message }) => (
    <div className="game-state-container">
        <p>{message}</p>
    </div>
);

const SpotTheDifference = () => {
    // 关卡数据管理
    const [levels, setLevels] = useState([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    
    // 游戏状态管理
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [isGameComplete, setIsGameComplete] = useState(false);
    
    // 加载和错误状态管理
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 在组件首次加载时从后端API获取关卡数据
    useEffect(() => {
        const fetchLevels = async () => {
            try {
                // 调用我们新创建的PHP API
                const response = await fetch('/backend/api/get-spot-the-difference-levels.php');
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                const data = await response.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setLevels(data.data);
                } else if (data.success && data.data.length === 0) {
                    setError('暂无可用关卡，请稍后重试。');
                } 
                else {
                    throw new Error(data.error || 'Failed to load level data.');
                }
            } catch (err) {
                setError(`获取关卡失败: ${err.message}`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLevels();
    }, []); // 空依赖数组意味着这个effect只在组件挂载时运行一次

    const currentLevel = levels[currentLevelIndex];
    const differences = currentLevel?.differences || [];

    // 检查关卡或游戏是否完成
    useEffect(() => {
        if (levels.length > 0 && foundDifferences.length === differences.length) {
            setIsLevelComplete(true);
            if (currentLevelIndex === levels.length - 1) {
                setIsGameComplete(true);
            }
        }
    }, [foundDifferences, differences, currentLevelIndex, levels]);

    const handleImageClick = (e) => {
        if (isLevelComplete || !currentLevel) return;

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        differences.forEach((diff, index) => {
            const distance = Math.sqrt(Math.pow(x - (diff.x * (rect.width / 1024)), 2) + Math.pow(y - (diff.y * (rect.height / 1024)), 2));
            if (distance < diff.radius) {
                if (!foundDifferences.includes(index)) {
                    setFoundDifferences(prev => [...prev, index]);
                }
            }
        });
    };

    const goToLevel = (index) => {
        if (index >= 0 && index < levels.length) {
            setCurrentLevelIndex(index);
            setFoundDifferences([]);
            setIsLevelComplete(false);
            setIsGameComplete(false);
        }
    };

    const handleRestartGame = () => {
        // 重新随机排序关卡并从第一个开始
        setLevels(prevLevels => [...prevLevels].sort(() => Math.random() - 0.5));
        goToLevel(0);
    };

    // --- 渲染逻辑 ---

    if (isLoading) {
        return <GameStateDisplay message="正在加载关卡，请稍候..." />;
    }

    if (error) {
        return <GameStateDisplay message={error} />;
    }

    if (!currentLevel) {
        return <GameStateDisplay message="没有可玩的关卡了！" />;
    }

    // 游戏主界面
    return (
        <div className="spot-the-difference-container">
            <h1>大家来找茬 - 第 {currentLevelIndex + 1} / {levels.length} 关</h1>
            <div className="images-container">
                <div className="image-wrapper" onClick={handleImageClick}>
                    <img src={currentLevel.original} alt="Original" crossOrigin="anonymous" />
                    {foundDifferences.map(index => {
                        const diff = differences[index];
                        return <div key={index} className="difference-marker" style={{ left: `${(diff.x/1024)*100}%`, top: `${(diff.y/1024)*100}%`, width: `${diff.radius*2}px`, height: `${diff.radius*2}px` }} />;
                    })}
                </div>
                <div className="image-wrapper" onClick={handleImageClick}>
                    <img src={currentLevel.modified} alt="Modified" crossOrigin="anonymous" />
                     {foundDifferences.map(index => {
                        const diff = differences[index];
                        return <div key={index} className="difference-marker" style={{ left: `${(diff.x/1024)*100}%`, top: `${(diff.y/1024)*100}%`, width: `${diff.radius*2}px`, height: `${diff.radius*2}px` }} />;
                    })}
                </div>
            </div>

            {isGameComplete ? (
                <div className="game-complete-message">
                    <h2>恭喜你，全部通关！</h2>
                    <button onClick={handleRestartGame}>再玩一次</button>
                </div>
            ) : (
                <>
                    <p>找到的差异点: {foundDifferences.length} / {differences.length}</p>
                    {isLevelComplete && (
                        <div className="level-complete-message">
                            <h3>太棒了，完成本关！</h3>
                            <button onClick={() => goToLevel(currentLevelIndex + 1)}>下一关</button>
                        </div>
                    )}
                    <div className="level-controls">
                        <button onClick={() => goToLevel(currentLevelIndex - 1)} disabled={currentLevelIndex === 0}>上一关</button>
                        <button onClick={() => goToLevel(currentLevelIndex + 1)} disabled={isGameComplete || !isLevelComplete}>
                            下一关
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SpotTheDifference;
