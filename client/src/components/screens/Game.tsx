import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameInput } from '../../hooks/useGameInput';
import { useGameStore } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';
import GameScene from '../three/GameScene';
import GameHUD from '../ui/GameHUD';

export default function Game() {
  const { gameState, opponents, pendingGarbage, getMyState } = useGameStore();
  const { playSound, checkGameStateChanges, resetTracking, setEnabled } = useSound();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastCountdown = useRef<number | null>(null);
  const gameStarted = useRef(false);

  useGameInput(playSound);

  useEffect(() => {
    resetTracking();
    gameStarted.current = false;
    lastCountdown.current = null;
  }, [resetTracking]);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.status === 'countdown') {
      if (lastCountdown.current !== gameState.countdown) {
        playSound('countdown');
        lastCountdown.current = gameState.countdown;
      }
    }

    if (gameState.status === 'playing' && !gameStarted.current) {
      playSound('start');
      gameStarted.current = true;
    }

    const myState = getMyState();
    if (myState && gameState.status === 'playing') {
      checkGameStateChanges(
        myState.level,
        myState.linesCleared,
        myState.combo,
        myState.backToBack
      );
    }
  }, [gameState, playSound, checkGameStateChanges, getMyState]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    setEnabled(newState);
  };

  if (!gameState) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-cyan-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (gameState.status === 'countdown') {
    const opponentNames = opponents.map(o => o.name).join(', ');
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/80">
        <div className="text-center">
          <p className="text-2xl text-gray-400 mb-4">
            {opponents.length === 1 ? `VS ${opponentNames}` : `${opponents.length + 1} Players Battle`}
          </p>
          <div className="text-9xl font-black text-cyan-400 glow-text animate-pulse">
            {gameState.countdown}
          </div>
          <p className="text-xl text-gray-400 mt-4">Get Ready!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 2, 22], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <GameScene />
      </Canvas>

      <GameHUD />

      <button
        type="button"
        onClick={toggleSound}
        className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors z-50"
        title={soundEnabled ? 'Mute' : 'Unmute'}
      >
        {soundEnabled ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2l4-4v14l-4-4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>

      {pendingGarbage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-red-600/90 px-6 py-3 rounded-lg animate-pulse">
            <p className="text-xl font-bold text-white">
              +{pendingGarbage.lines} GARBAGE INCOMING!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
