import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameAction, GAME_CONFIG } from '@3d-tetris/shared';
import { useLocalPrediction } from './useLocalPrediction';

type SoundType = 'move' | 'rotate' | 'drop' | 'hardDrop' | 'hold' | 'lineClear' | 'tetris' | 'tSpin' | 'combo' | 'levelUp' | 'gameOver' | 'countdown' | 'start';

const FAST_DAS = 80;
const FAST_ARR = 0;
const DOWN_ARR = 30;

export function useGameInput(playSound?: (sound: SoundType) => void) {
  const { socket, gameState, playerId } = useGameStore();
  const { applyLocalAction } = useLocalPrediction();
  
  const socketRef = useRef(socket);
  const gameStateRef = useRef(gameState);
  const playerIdRef = useRef(playerId);
  const applyLocalActionRef = useRef(applyLocalAction);
  const playSoundRef = useRef(playSound);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const dasTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const arrIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    socketRef.current = socket;
    gameStateRef.current = gameState;
    playerIdRef.current = playerId;
    applyLocalActionRef.current = applyLocalAction;
    playSoundRef.current = playSound;
  }, [socket, gameState, playerId, applyLocalAction, playSound]);

  const sendAction = useCallback((action: GameAction, sound?: SoundType) => {
    const gs = gameStateRef.current;
    const sock = socketRef.current;
    const pid = playerIdRef.current;
    
    if (!sock || !gs || gs.status !== 'playing') return;

    const myState = gs.players.find((p) => p.id === pid);
    if (!myState?.isAlive) return;

    applyLocalActionRef.current(action);
    sock.emit('gameAction', action);
    
    if (sound && playSoundRef.current) {
      playSoundRef.current(sound);
    }
  }, []);

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

  const startDAS = useCallback((key: string, action: GameAction, sound?: SoundType) => {
    sendAction(action, sound);

    const dasTimer = setTimeout(() => {
      if (FAST_ARR === 0) {
        const instantMove = () => {
          if (keysPressed.current.has(key)) {
            sendAction(action);
            requestAnimationFrame(instantMove);
          }
        };
        requestAnimationFrame(instantMove);
      } else {
        const arrInterval = setInterval(() => {
          if (keysPressed.current.has(key)) {
            sendAction(action);
          } else {
            clearInterval(arrInterval);
            arrIntervals.current.delete(key);
          }
        }, FAST_ARR);
        arrIntervals.current.set(key, arrInterval);
      }
    }, FAST_DAS);

    dasTimers.current.set(key, dasTimer);
  }, [sendAction]);

  const startDownMove = useCallback((key: string, sound?: SoundType) => {
    sendAction({ type: 'softDrop' }, sound);

    const dasTimer = setTimeout(() => {
      const arrInterval = setInterval(() => {
        if (keysPressed.current.has(key)) {
          sendAction({ type: 'softDrop' });
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
  }, [sendAction, startDAS, startDownMove, stopDAS]);
}
