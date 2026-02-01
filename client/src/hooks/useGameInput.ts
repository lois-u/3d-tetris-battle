import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameAction } from '@3d-tetris/shared';
import { useLocalPrediction } from './useLocalPrediction';

type SoundType = 'move' | 'rotate' | 'drop' | 'hardDrop' | 'hold' | 'lineClear' | 'tetris' | 'tSpin' | 'combo' | 'levelUp' | 'gameOver' | 'countdown' | 'start';

const FAST_DAS = 133;
const FAST_ARR = 50;
const DOWN_ARR = 50;

export function useGameInput(playSound?: (sound: SoundType) => void) {
  const { applyLocalAction } = useLocalPrediction();
  
  const keysPressed = useRef<Set<string>>(new Set());
  const dasTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const arrIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const playSoundRef = useRef(playSound);

  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  const sendAction = useCallback((action: GameAction, sound?: SoundType) => {
    const { socket, gameState, playerId } = useGameStore.getState();
    
    if (!socket || !gameState || gameState.status !== 'playing') return;

    const myState = gameState.players.find((p) => p.id === playerId);
    if (!myState?.isAlive) return;

    applyLocalAction(action);
    socket.emit('gameAction', action);
    
    if (sound && playSoundRef.current) {
      playSoundRef.current(sound);
    }
  }, [applyLocalAction]);

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
          sendAction({ type: 'hardDrop' }, 'hardDrop');
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

      for (const timer of dasTimers.current.values()) {
        clearTimeout(timer);
      }
      for (const interval of arrIntervals.current.values()) {
        clearInterval(interval);
      }
    };
  }, [sendAction, startDAS, startDownMove, stopDAS, stopAllDAS]);
}
