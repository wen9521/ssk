// src/components/doudizhu/DoudizhuPlay.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDoudizhuStore } from '@/utils/doudizhu-store';
import DoudizhuBoard from './DoudizhuBoard';
import './Doudizhu.css';

export default function DoudizhuPlay() {
  const navigate = useNavigate();
  const startGame = useDoudizhuStore(state => state.startGame);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const handleQuit = () => {
    navigate('/');
  };

  return <DoudizhuBoard onQuit={handleQuit} />;
}