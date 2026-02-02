import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useSound } from '../../hooks/useSound';
import { TetrisEngine, GAME_CONFIG, GameAction } from '@3d-tetris/shared';
import SoloGameScene from '../three/SoloGameScene';

type SoundType = 'move' | 'rotate' | 'drop' | 'hardDrop' | 'hold' | 'lineClear' | 'tetris' | 'tSpin' | 'combo' | 'levelUp' | 'gameOver' | 'countdown' | 'start';

const FAST_DAS = 133;
const FAST_ARR = 50;
const DOWN_ARR = 50;
const HARD_DROP_LOCK_MS = 100;

export default function SoloGame() {
  const { setScreen, setSoloFinalScore, playerName } = useGameStore();
  const { playSound, playBGM, stopBGM, setEnabled, setBGMEnabled } = useSound();
  
  const engineRef = useRef<TetrisEngine | null>(null);
  const [gameState, setGameState] = useState<ReturnType<TetrisEngine['getState']> | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastGravityTime = useRef(0);
  const lastLockTime = useRef<number | null>(null);
  const lockMoveCount = useRef(0);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const dasTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const arrIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const lastHardDropTime = useRef(0);

  const updateState = useCallback(() => {
    if (engineRef.current) {
      setGameState(engineRef.current.getState());
    }
  }, []);

  const handleGameOver = useCallback(() => {
    if (!engineRef.current) return;
    const state = engineRef.current.getState();
    setSoloFinalScore({
      score: state.score,
      level: state.level,
      lines: state.linesCleared,
    });
    stopBGM();
    playSound('gameOver');
    setScreen('soloGameOver');
  }, [setSoloFinalScore, setScreen, stopBGM, playSound]);

  const sendAction = useCallback((action: GameAction, sound?: SoundType, isHardDrop?: boolean) => {
    if (!engineRef.current || !isPlaying) return;

    const isMoveAction = action.type === 'moveLeft' || action.type === 'moveRight';
    if (isMoveAction && Date.now() - lastHardDropTime.current < HARD_DROP_LOCK_MS) {
      return;
    }

    if (isHardDrop) {
      lastHardDropTime.current = Date.now();
    }

    let success = false;

    switch (action.type) {
      case 'moveLeft':
        success = engineRef.current.moveLeft().success;
        break;
      case 'moveRight':
        success = engineRef.current.moveRight().success;
        break;
      case 'moveDown':
        success = engineRef.current.moveDown().success;
        break;
      case 'softDrop':
        success = engineRef.current.softDrop().success;
        break;
      case 'hardDrop': {
        const result = engineRef.current.hardDrop();
        success = true;
        if (result.lineClearResult) {
          if (result.lineClearResult.linesCleared === 4) {
            playSound('tetris');
          } else if (result.lineClearResult.linesCleared > 0) {
            playSound('lineClear');
          }
        }
        engineRef.current.spawnPiece();
        lastLockTime.current = null;
        lockMoveCount.current = 0;
        if (engineRef.current.isGameOver()) {
          handleGameOver();
          return;
        }
        break;
      }
      case 'rotateCW':
        success = engineRef.current.rotateCW().success;
        break;
      case 'rotateCCW':
        success = engineRef.current.rotateCCW().success;
        break;
      case 'rotate180':
        success = engineRef.current.rotate180().success;
        break;
      case 'hold':
        success = engineRef.current.hold();
        break;
    }

    if (success) {
      if (sound) playSound(sound);
      
      if (engineRef.current.isOnGround() && action.type !== 'moveDown' && action.type !== 'softDrop') {
        lastLockTime.current = Date.now();
        lockMoveCount.current++;
      }
    }

    updateState();
  }, [isPlaying, playSound, handleGameOver, updateState]);

  const stopDAS = useCallback((key: string) => {
    const dasTimer = dasTimers.current.get(key);
    if (dasTimer) {
      clearTimeout(dasTimer);
      dasTimers.current.delete(key);
    }
    const arrInterval = arrIntervals.current.get(key);
    if (arrInterval) {
      clearInterval(arrInterval);
      arrIntervals.current.delete(key);
    }
  }, []);

  const stopAllDAS = useCallback(() => {
    for (const timer of dasTimers.current.values()) {
      clearTimeout(timer);
    }
    for (const interval of arrIntervals.current.values()) {
      clearInterval(interval);
    }
    dasTimers.current.clear();
    arrIntervals.current.clear();
    keysPressed.current.clear();
  }, []);

  const startDAS = useCallback((key: string, action: GameAction, sound?: SoundType) => {
    sendAction(action, sound);
    const dasTimer = setTimeout(() => {
      const arrInterval = setInterval(() => {
        if (keysPressed.current.has(key)) {
          sendAction(action);
        } else {
          clearInterval(arrInterval);
          arrIntervals.current.delete(key);
        }
      }, FAST_ARR);
      arrIntervals.current.set(key, arrInterval);
    }, FAST_DAS);
    dasTimers.current.set(key, dasTimer);
  }, [sendAction]);

  const startDownMove = useCallback((key: string, sound?: SoundType) => {
    sendAction({ type: 'moveDown' }, sound);
    const dasTimer = setTimeout(() => {
      const arrInterval = setInterval(() => {
        if (keysPressed.current.has(key)) {
          sendAction({ type: 'moveDown' });
        } else {
          clearInterval(arrInterval);
          arrIntervals.current.delete(key);
        }
      }, DOWN_ARR);
      arrIntervals.current.set(key, arrInterval);
    }, FAST_DAS);
    dasTimers.current.set(key, dasTimer);
  }, [sendAction]);

  useEffect(() => {
    engineRef.current = new TetrisEngine();
    engineRef.current.spawnPiece();
    updateState();

    let countdownInterval: ReturnType<typeof setInterval>;
    let currentCount = 3;

    countdownInterval = setInterval(() => {
      playSound('countdown');
      currentCount--;
      setCountdown(currentCount);
      
      if (currentCount <= 0) {
        clearInterval(countdownInterval);
        playSound('start');
        playBGM();
        setIsPlaying(true);
        lastGravityTime.current = Date.now();
      }
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      stopBGM();
      stopAllDAS();
    };
  }, [updateState, playSound, playBGM, stopBGM, stopAllDAS]);

  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = () => {
      if (!engineRef.current || engineRef.current.isGameOver()) return;

      const now = Date.now();
      const gravity = engineRef.current.getGravity();
      const gravityInterval = 1000 / gravity;

      if (now - lastGravityTime.current >= gravityInterval) {
        const moved = engineRef.current.moveDown().success;
        lastGravityTime.current = now;
        
        if (!moved && lastLockTime.current === null) {
          lastLockTime.current = now;
        }
        
        updateState();
      }

      if (lastLockTime.current !== null) {
        const lockElapsed = now - lastLockTime.current;
        const shouldForceLock = lockMoveCount.current >= GAME_CONFIG.lockMoves;
        
        if (lockElapsed >= GAME_CONFIG.lockDelay || shouldForceLock) {
          const result = engineRef.current.lockPiece();
          if (result) {
            if (result.linesCleared === 4) {
              playSound('tetris');
            } else if (result.linesCleared > 0) {
              playSound('lineClear');
            }
          }
          engineRef.current.spawnPiece();
          lastLockTime.current = null;
          lockMoveCount.current = 0;
          
          if (engineRef.current.isGameOver()) {
            handleGameOver();
            return;
          }
          
          updateState();
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlaying, updateState, playSound, handleGameOver]);

  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keysPressed.current.has(e.code)) return;
      keysPressed.current.add(e.code);

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          startDAS(e.code, { type: 'moveLeft' }, 'move');
          break;
        case 'ArrowRight':
        case 'KeyD':
          startDAS(e.code, { type: 'moveRight' }, 'move');
          break;
        case 'ArrowDown':
        case 'KeyS':
          startDownMove(e.code, 'drop');
          break;
        case 'Space':
          e.preventDefault();
          stopAllDAS();
          sendAction({ type: 'hardDrop' }, 'hardDrop', true);
          break;
        case 'ArrowUp':
        case 'KeyX':
          sendAction({ type: 'rotateCW' }, 'rotate');
          break;
        case 'KeyZ':
        case 'ControlLeft':
        case 'ControlRight':
          sendAction({ type: 'rotateCCW' }, 'rotate');
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          sendAction({ type: 'hold' }, 'hold');
          break;
        case 'Escape':
          stopBGM();
          setScreen('menu');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
      stopDAS(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, sendAction, startDAS, startDownMove, stopDAS, stopAllDAS, stopBGM, setScreen]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    setEnabled(newState);
    setBGMEnabled(newState);
  };

  if (!gameState) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-cyan-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/80">
        <div className="text-center">
          <p className="text-2xl text-gray-400 mb-4">SOLO MODE</p>
          <div className="text-9xl font-black text-cyan-400 glow-text animate-pulse">
            {countdown}
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
        <SoloGameScene
          board={gameState.board}
          currentPiece={gameState.currentPiece}
          holdPiece={gameState.holdPiece}
          nextPieces={gameState.nextPieces}
        />
      </Canvas>

      <div className="absolute top-4 left-4 panel-glow p-4 z-50">
        <div className="text-sm text-gray-400">SCORE</div>
        <div className="text-2xl font-bold text-white">{gameState.score.toLocaleString()}</div>
        <div className="text-sm text-gray-400 mt-2">LEVEL</div>
        <div className="text-xl font-bold text-purple-400">{gameState.level}</div>
        <div className="text-sm text-gray-400 mt-2">LINES</div>
        <div className="text-xl font-bold text-cyan-400">{gameState.linesCleared}</div>
      </div>

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

      <div className="absolute bottom-4 left-4 text-sm text-gray-500 z-50">
        Press ESC to quit
      </div>
    </div>
  );
}
