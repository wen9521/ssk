// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect, useMemo } from 'react';
import './styles/SpotTheDifference.css';
import { localLevels } from '../gameLogic/levels'; // Import local levels

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
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // --- Data Fetching Effect with Offline Fallback ---
    useEffect(() => {
        const fetchLevels = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const data = await response.json();
                if (data.success && data.data.length > 0) {
                    setLevels(data.data);
                    setIsOfflineMode(false);
                } else {
                    // API returned success but no data, fall back to local
                    throw new Error('No levels returned from API');
                }
            } catch (err) {
                // If API fails, use local levels as a fallback
                console.warn(`API request failed: ${err.message}. Loading local fallback levels.`);
                setLevels(localLevels);
                setIsOfflineMode(true);
            } finally {
                setIsLoading(false);
                setError(null); // Clear previous errors
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
        
        const naturalRatio = imgElement.naturalWidth / imgElement.naturalHeight;
        const clientRatio = imgElement.clientWidth / imgElement.clientHeight;
        let imgDisplayedWidth, imgDisplayedHeight, offsetX, offsetY;

        if (naturalRatio > clientRatio) {
            imgDisplayedWidth = imgElement.clientWidth;
            imgDisplayedHeight = imgDisplayedWidth / naturalRatio;
            offsetX = 0;
            offsetY = (imgElement.clientHeight - imgDisplayedHeight) / 2;
        } else {
            imgDisplayedHeight = imgElement.clientHeight;
            imgDisplayedWidth = imgDisplayedHeight * naturalRatio;
            offsetY = 0;
            offsetX = (imgElement.clientWidth - imgDisplayedWidth) / 2;
        }

        const x = e.clientX - rect.left - offsetX;
        const y = e.clientY - rect.top - offsetY;
        const scaleFactor = imgDisplayedWidth / 1024; // Assuming original images are 1024px wide

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
    if (isLoading) return <GameStateDisplay message="正在加载关卡..." isLoading={true} />;
    if (error) return <GameStateDisplay message={error} />;
    if (!currentLevel) return <GameStateDisplay message="太棒了！您已完成所有当前关卡！" />;

    return (
        <div className="spot-the-difference-container">
            <header className="game-header">
                {isOfflineMode && <p className="offline-notice">离线模式</p>}
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
