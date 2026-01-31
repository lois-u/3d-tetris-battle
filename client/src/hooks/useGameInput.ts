import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameAction, GAME_CONFIG } from '@3d-tetris/shared';

type SoundType = 'move' | 'rotate' | 'drop' | 'hardDrop' | 'hold' | 'lineClear' | 'tetris' | 'tSpin' | 'combo' | 'levelUp' | 'gameOver' | 'countdown' | 'start';

export function useGameInput(playSound?: (sound: SoundType) => void) {
  const { socket, gameState, playerId } = useGameStore();
  const keysPressed = useRef<Set<string>>(new Set());
  const dasTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const arrIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const sendAction = useCallback(
    (action: GameAction, sound?: SoundType) => {
      if (!socket || !gameState || gameState.status !== 'playing') return;

      const myState = gameState.players.find((p) => p.id === playerId);
      if (!myState?.isAlive) return;

      socket.emit('gameAction', action);
      if (sound && playSound) {
        playSound(sound);
      }
    },
    [socket, gameState, playerId, playSound]
  );

  const startDAS = useCallback(
    (key: string, action: GameAction, sound?: SoundType) => {
      sendAction(action, sound);

      const dasTimer = setTimeout(() => {
        const arrInterval = setInterval(() => {
          if (keysPressed.current.has(key)) {
            sendAction(action);
          } else {
            clearInterval(arrInterval);
            arrIntervals.current.delete(key);
          }
        }, GAME_CONFIG.arr);

        arrIntervals.current.set(key, arrInterval);
      }, GAME_CONFIG.das);

      dasTimers.current.set(key, dasTimer);
    },
    [sendAction]
  );

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

  const startSoftDrop = useCallback(
    (key: string, sound?: SoundType) => {
      sendAction({ type: 'softDrop' }, sound);

      const arrInterval = setInterval(() => {
        if (keysPressed.current.has(key)) {
          sendAction({ type: 'softDrop' });
        } else {
          clearInterval(arrInterval);
          arrIntervals.current.delete(key);
        }
      }, GAME_CONFIG.arr * 2);

      arrIntervals.current.set(key, arrInterval);
    },
    [sendAction]
  );

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
          startSoftDrop(e.code, 'drop');
          break;
        case 'Space':
          e.preventDefault();
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
  }, [sendAction, startDAS, startSoftDrop, stopDAS]);
}
