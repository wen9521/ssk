// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect, useMemo } from 'react';
import './styles/SpotTheDifference.css';

// The URL of your Cloudflare Worker which now acts as the main API
const API_URL = 'https://render.wenge666.workers.dev/levels';

const GameStateDisplay = ({ message }) => (
    <div className="game-state-container">
        <p>{message}</p>
    </div>
);

const SpotTheDifference = () => {
    const [levels, setLevels] = useState([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [isGameComplete, setIsGameComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                // Directly call the Cloudflare Worker, completely bypassing the PHP backend
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`The API server responded with status: ${response.status}`);
                }
                const data = await response.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    setLevels(data.data);
                } else if (data.success && data.data.length === 0) {
                    setError('暂无可用关卡，我们的AI正在努力生成中，请稍后重试。');
                } else {
                    throw new Error(data.error || 'Failed to load level data from the API.');
                }
            } catch (err) {
                setError(`获取关卡失败: ${err.message}`);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLevels();
    }, []);

    const currentLevel = levels[currentLevelIndex];
    const differences = useMemo(() => currentLevel?.differences || [], [currentLevel]);

    useEffect(() => {
        if (differences.length > 0 && foundDifferences.length === differences.length) {
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

        const imageWidth = rect.width;
        const originalWidth = 1024; // The original width of the generated images
        const scaleFactor = imageWidth / originalWidth;

        differences.forEach((diff, index) => {
            const distance = Math.sqrt(
                Math.pow(x - (diff.x * scaleFactor), 2) + 
                Math.pow(y - (diff.y * scaleFactor), 2)
            );
            if (distance < (diff.radius * scaleFactor)) {
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
        setLevels(prevLevels => [...prevLevels].sort(() => Math.random() - 0.5));
        goToLevel(0);
    };

    if (isLoading) return <GameStateDisplay message="正在从云端加载关卡，请稍候..." />;
    if (error) return <GameStateDisplay message={error} />;
    if (!currentLevel) return <GameStateDisplay message="太棒了！您已完成所有当前关卡！" />;

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
