// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect, useMemo } from 'react';
import './styles/SpotTheDifference.css';

const API_URL = 'https://render.wenge666.workers.dev/levels';

const GameStateDisplay = ({ message, isLoading = false }) => (
    <div className="game-state-container">
        {isLoading && <div className="loader"></div>}
        <p>{message}</p>
    </div>
);

const SpotTheDifference = () => {
    const [levels, setLevels] = useState([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchLevels = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const data = await response.json();
                if (data.success && data.data.length > 0) {
                    setLevels(data.data);
                } else {
                    setError('暂无可用关卡，我们的AI正在努力生成中，请稍后重试。');
                }
            } catch (err) {
                setError(`获取关卡失败: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLevels();
    }, []);

    const currentLevel = levels[currentLevelIndex];
    const differences = useMemo(() => currentLevel?.differences || [], [currentLevel]);
    const isLevelComplete = useMemo(() => differences.length > 0 && foundDifferences.length === differences.length, [foundDifferences, differences]);
    const isGameComplete = useMemo(() => isLevelComplete && currentLevelIndex === levels.length - 1, [isLevelComplete, currentLevelIndex, levels]);

    // --- Game Logic Handlers ---
    const handleImageClick = (e) => {
        if (isLevelComplete || !currentLevel) return;
        const imgElement = e.target;
        const rect = imgElement.getBoundingClientRect();
        
        // Calculate the real image size inside the object-fit container
        const naturalRatio = imgElement.naturalWidth / imgElement.naturalHeight;
        const clientRatio = imgElement.clientWidth / imgElement.clientHeight;
        let imgDisplayedWidth, imgDisplayedHeight, offsetX, offsetY;

        if (naturalRatio > clientRatio) { // Image is wider, letterboxed top/bottom
            imgDisplayedWidth = imgElement.clientWidth;
            imgDisplayedHeight = imgDisplayedWidth / naturalRatio;
            offsetX = 0;
            offsetY = (imgElement.clientHeight - imgDisplayedHeight) / 2;
        } else { // Image is taller, letterboxed left/right
            imgDisplayedHeight = imgElement.clientHeight;
            imgDisplayedWidth = imgDisplayedHeight * naturalRatio;
            offsetY = 0;
            offsetX = (imgElement.clientWidth - imgDisplayedWidth) / 2;
        }

        const x = e.clientX - rect.left - offsetX;
        const y = e.clientY - rect.top - offsetY;
        const scaleFactor = imgDisplayedWidth / 1024;

        differences.forEach((diff, index) => {
            const distance = Math.sqrt(Math.pow(x - (diff.x * scaleFactor), 2) + Math.pow(y - (diff.y * scaleFactor), 2));
            if (distance < (diff.radius * scaleFactor) && !foundDifferences.includes(index)) {
                setFoundDifferences(prev => [...prev, index]);
            }
        });
    };

    const goToLevel = (index) => {
        if (index >= 0 && index < levels.length) {
            setCurrentLevelIndex(index);
            setFoundDifferences([]);
        }
    };

    const handleRestartGame = () => {
        setLevels(prevLevels => [...prevLevels].sort(() => Math.random() - 0.5));
        goToLevel(0);
    };

    // --- Render Logic ---
    if (isLoading) return <GameStateDisplay message="正在从云端加载关卡..." isLoading={true} />;
    if (error) return <GameStateDisplay message={error} />;
    if (!currentLevel) return <GameStateDisplay message="太棒了！您已完成所有当前关卡！" />;

    return (
        <div className="spot-the-difference-container">
            <header className="game-header">
                <h1>第 {currentLevelIndex + 1} / {levels.length} 关</h1>
                <p>找到的差异点: {foundDifferences.length} / {differences.length}</p>
            </header>

            <main className="images-container">
                <div className="image-wrapper" onClick={handleImageClick}>
                    <img src={currentLevel.original} alt="Original" crossOrigin="anonymous" />
                    {foundDifferences.map(index => {
                        const diff = differences[index];
                        return <div key={index} className="difference-marker" style={{ left: `${(diff.x/1024)*100}%`, top: `${(diff.y/1024)*100}%`, width: `${diff.radius*2}px`, height: `${diff.radius*2}px`, transform: 'translate(-50%, -50%)' }} />;
                    })}
                </div>
                <div className="image-wrapper" onClick={handleImageClick}>
                    <img src={currentLevel.modified} alt="Modified" crossOrigin="anonymous" />
                    {foundDifferences.map(index => {
                        const diff = differences[index];
                        return <div key={index} className="difference-marker" style={{ left: `${(diff.x/1024)*100}%`, top: `${(diff.y/1024)*100}%`, width: `${diff.radius*2}px`, height: `${diff.radius*2}px`, transform: 'translate(-50%, -50%)' }} />;
                    })}
                </div>
            </main>

            <footer className="game-footer">
                {isGameComplete ? (
                    <div className="game-complete-message">
                        <button onClick={handleRestartGame}>🎉 恭喜通关！再玩一次 🎉</button>
                    </div>
                ) : isLevelComplete ? (
                    <div className="level-complete-message">
                        <button onClick={() => goToLevel(currentLevelIndex + 1)}>✔️ 太棒了！下一关</button>
                    </div>
                ) : (
                    <div className="level-controls">
                        <button onClick={() => goToLevel(currentLevelIndex - 1)} disabled={currentLevelIndex === 0}>上一关</button>
                        <button onClick={() => goToLevel(currentLevelIndex + 1)} disabled={!isLevelComplete}>下一关</button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default SpotTheDifference;
