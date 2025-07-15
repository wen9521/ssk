// frontend/src/components/SpotTheDifference.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/SpotTheDifference.css';
import { localLevels } from '../gameLogic/levels'; 

// --- Configuration ---
const R2_PUBLIC_URL = "https://pub-5a0d7fbdb4e94d9db5d2a074b6e346e4.r2.dev"; 
const LEVELS_JSON_URL = `${R2_PUBLIC_URL}/levels.json`;

// --- Components ---
const GameStateDisplay = ({ message, isLoading = false, onRetry }) => (
    <div className="game-state-container">
        {isLoading && <div className="loader"></div>}
        <p>{message}</p>
        {onRetry && <button onClick={onRetry}>重试</button>}
    </div>
);

const DifferenceMarker = ({ diff, scaleFactor }) => {
    const style = {
        left: `${(diff.x / 1024) * 100}%`,
        top: `${(diff.y / 1024) * 100}%`,
        width: `${diff.radius * 2 * scaleFactor}px`,
        height: `${diff.radius * 2 * scaleFactor}px`,
        transform: 'translate(-50%, -50%)', // Center the marker on the coordinates
    };
    return <div className="difference-marker" style={style} />;
};

const GameImage = ({ src, onClick, children }) => {
    return (
        <div className="image-wrapper" onClick={onClick}>
            <img src={src} alt={src.includes('original') ? 'Original' : 'Modified'} crossOrigin="anonymous" />
            {children}
        </div>
    );
};


// --- Main Component ---
const SpotTheDifference = () => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState([]);
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [foundDifferences, setFoundDifferences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [imageScaleFactor, setImageScaleFactor] = useState(1);

    const fetchLevels = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${LEVELS_JSON_URL}?cb=${new Date().getTime()}`, { signal: AbortSignal.timeout(5000) });
            if (!response.ok) throw new Error('网络响应不佳，请稍后再试。');
            
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                setLevels(data.sort(() => Math.random() - 0.5)); // Shuffle levels
                setIsOfflineMode(false);
            } else {
                throw new Error('在线关卡加载失败，切换至离线模式。');
            }
        } catch (err) {
            console.warn(`无法从服务器加载关卡: ${err.message}`);
            setLevels(localLevels.sort(() => Math.random() - 0.5)); // Shuffle local levels
            setIsOfflineMode(true);
        } finally {
            setIsLoading(false);
            setCurrentLevelIndex(0);
            setFoundDifferences([]);
        }
    }, []);

    useEffect(() => {
        fetchLevels();
    }, [fetchLevels]);

    const currentLevel = useMemo(() => levels[currentLevelIndex], [levels, currentLevelIndex]);
    const differences = useMemo(() => currentLevel?.differences || [], [currentLevel]);
    const isLevelComplete = useMemo(() => differences.length > 0 && foundDifferences.length === differences.length, [foundDifferences, differences]);
    const isGameComplete = useMemo(() => isLevelComplete && currentLevelIndex === levels.length - 1, [isLevelComplete, currentLevelIndex, levels.length]);

    const handleImageClick = useCallback((e) => {
        if (isLevelComplete || !currentLevel) return;

        const imgElement = e.currentTarget.querySelector('img');
        const rect = imgElement.getBoundingClientRect();
        
        // Calculate the scale of the displayed image relative to its natural size
        const scale = imgElement.clientWidth / imgElement.naturalWidth;
        setImageScaleFactor(scale);

        // Get click coordinates relative to the image's top-left corner
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        differences.forEach((diff, index) => {
            if (foundDifferences.includes(index)) return;
            const distance = Math.sqrt(Math.pow(x - diff.x, 2) + Math.pow(y - diff.y, 2));
            if (distance < diff.radius) {
                setFoundDifferences(prev => [...new Set([...prev, index])]); // Use Set to avoid duplicates
            }
        });
    }, [isLevelComplete, currentLevel, differences, foundDifferences]);
    
    const goToLevel = useCallback((index) => {
        if (index >= 0 && index < levels.length) {
            setCurrentLevelIndex(index);
            setFoundDifferences([]);
        }
    }, [levels.length]);

    const handleRestartGame = useCallback(() => {
        setLevels(prevLevels => [...prevLevels].sort(() => Math.random() - 0.5));
        goToLevel(0);
    }, [goToLevel]);

    if (isLoading) return <GameStateDisplay message="正在加载关卡..." isLoading={true} />;
    if (error) return <GameStateDisplay message={error} onRetry={fetchLevels} />;
    if (!currentLevel) return <GameStateDisplay message="恭喜！您已完成所有关卡！" />;

    return (
        <div className="spot-the-difference-container">
            <header className="game-header">
                <button className="back-button" onClick={() => navigate('/')}>&lt; 退出</button>
                <div className="game-info">
                    <h1>第 {currentLevelIndex + 1} / {levels.length} 关</h1>
                    <p>
                        {isOfflineMode && <span className="offline-badge">离线</span>}
                        找到的差异: {foundDifferences.length} / {differences.length}
                    </p>
                </div>
            </header>

            <main className="images-container">
                <GameImage src={currentLevel.original} onClick={handleImageClick}>
                    {foundDifferences.map(index => (
                        <DifferenceMarker key={index} diff={differences[index]} scaleFactor={imageScaleFactor} />
                    ))}
                </GameImage>
                <GameImage src={currentLevel.modified} onClick={handleImageClick}>
                    {foundDifferences.map(index => (
                        <DifferenceMarker key={index} diff={differences[index]} scaleFactor={imageScaleFactor} />
                    ))}
                </GameImage>
            </main>

            <footer className="game-footer">
                {isGameComplete ? (
                    <button className="game-button accent" onClick={handleRestartGame}>🎉 恭喜通关！再玩一次 🎉</button>
                ) : isLevelComplete ? (
                    <button className="game-button primary" onClick={() => goToLevel(currentLevelIndex + 1)}>✔️ 太棒了！下一关</button>
                ) : (
                    <div className="level-controls">
                        <button className="game-button" onClick={() => goToLevel(currentLevelIndex - 1)} disabled={currentLevelIndex === 0}>上一关</button>
                        <button className="game-button" onClick={() => goToLevel(currentLevelIndex + 1)} disabled={currentLevelIndex >= levels.length - 1}>下一关</button>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default SpotTheDifference;
