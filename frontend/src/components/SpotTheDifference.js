// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect, useMemo } from 'react';
import './styles/SpotTheDifference.css';
import { localLevels } from '../gameLogic/levels'; // Local levels for offline fallback

// --- Configuration ---
// IMPORTANT: Replace this with your actual R2 public URL.
const R2_PUBLIC_URL = "https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev"; 
const LEVELS_JSON_URL = `${R2_PUBLIC_URL}/levels.json`;

// --- Components ---
const GameStateDisplay = ({ message, isLoading = false }) => (
    <div className="game-state-container">
        {isLoading && <div className="loader"></div>}
        <p>{message}</p>
    </div>
);

// --- Main Component ---
const SpotTheDifference = () => {
    const [levels, setLevels] = useState([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    useEffect(() => {
        const fetchLevels = async () => {
            setIsLoading(true);
            try {
                // Fetch with a cache-busting parameter to always get the latest version
                const response = await fetch(`${LEVELS_JSON_URL}?cb=${new Date().getTime()}`);
                if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
                const data = await response.json();
                
                if (Array.isArray(data) && data.length > 0) {
                    setLevels(data);
                    setIsOfflineMode(false);
                } else {
                    throw new Error('No levels found in levels.json');
                }
            } catch (err) {
                console.warn(`Failed to fetch from R2: ${err.message}. Using local fallback.`);
                setLevels(localLevels);
                setIsOfflineMode(true);
            } finally {
                setIsLoading(false);
                setError(null);
            }
        };
        fetchLevels();
    }, []);

    const currentLevel = levels[currentLevelIndex];
    const differences = useMemo(() => currentLevel?.differences || [], [currentLevel]);
    const isLevelComplete = useMemo(() => differences.length > 0 && foundDifferences.length === differences.length, [foundDifferences, differences]);
    const isGameComplete = useMemo(() => isLevelComplete && currentLevelIndex === levels.length - 1, [isLevelComplete, currentLevelIndex, levels]);

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
        const scaleFactor = imgDisplayedWidth / 1024;

        differences.forEach((diff, index) => {
            if (foundDifferences.includes(index)) return;
            const distance = Math.sqrt(Math.pow(x - (diff.x * scaleFactor), 2) + Math.pow(y - (diff.y * scaleFactor), 2));
            if (distance < (diff.radius * scaleFactor)) {
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

    if (isLoading) return <GameStateDisplay message="正在加载关卡..." isLoading={true} />;
    if (error) return <GameStateDisplay message={error} />;
    if (!currentLevel) return <GameStateDisplay message="太棒了！您已完成所有当前关卡！" />;

    return (
        <div className="spot-the-difference-container">
            <header className="game-header">
                {isOfflineMode && <p className="offline-notice">离线模式 (无法连接到服务器)</p>}
                <h1>第 {currentLevelIndex + 1} / {levels.length} 关</h1>
                <p>找到的差异点: {foundDifferences.length} / {differences.length}</p>
            </header>
            <main className="images-container">
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
            </main>
            <footer className="game-footer">
                {isGameComplete ? (
                    <button onClick={handleRestartGame}>🎉 恭喜通关！再玩一次 🎉</button>
                ) : isLevelComplete ? (
                    <button onClick={() => goToLevel(currentLevelIndex + 1)}>✔️ 太棒了！下一关</button>
                ) : (
                    <div className="level-controls">
                        <button onClick={() => goToLevel(currentLevelIndex - 1)} disabled={currentLevelIndex === 0}>上一关</button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default SpotTheDifference;
