import { useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  TetrisEngine,
  GameAction,
  PlayerState,
  Tetromino,
  Board,
  TetrominoType,
} from '@3d-tetris/shared';

interface LocalState {
  board: Board;
  currentPiece: Tetromino | null;
  holdPiece: TetrominoType | null;
  canHold: boolean;
}

export function useLocalPrediction() {
  const { gameState, playerId, setGameState, setLastPredictionTime } = useGameStore();
  const localEngineRef = useRef<TetrisEngine | null>(null);
  const lastServerStateRef = useRef<PlayerState | null>(null);

  const initLocalEngine = useCallback(() => {
    if (!gameState || !playerId) return;
    
    const myState = gameState.players.find((p) => p.id === playerId);
    if (!myState) return;

    localEngineRef.current = new TetrisEngine();
    lastServerStateRef.current = myState;
  }, [gameState, playerId]);

  const applyLocalAction = useCallback(
    (action: GameAction): boolean => {
      if (!gameState || !playerId) return false;

      const myState = gameState.players.find((p) => p.id === playerId);
      if (!myState?.isAlive || !myState.currentPiece) return false;

      let newPiece: Tetromino | null = { ...myState.currentPiece };
      let newBoard = myState.board;
      let newHoldPiece = myState.holdPiece;
      let newCanHold = myState.canHold;
      let success = false;

      switch (action.type) {
        case 'moveLeft':
          if (canMove(newBoard, newPiece, -1, 0)) {
            newPiece = { ...newPiece, position: { ...newPiece.position, x: newPiece.position.x - 1 } };
            success = true;
          }
          break;
        case 'moveRight':
          if (canMove(newBoard, newPiece, 1, 0)) {
            newPiece = { ...newPiece, position: { ...newPiece.position, x: newPiece.position.x + 1 } };
            success = true;
          }
          break;
        case 'softDrop':
          if (canMove(newBoard, newPiece, 0, -1)) {
            newPiece = { ...newPiece, position: { ...newPiece.position, y: newPiece.position.y - 1 } };
            success = true;
          }
          break;
        case 'rotateCW':
        case 'rotateCCW':
        case 'rotate180':
        case 'hardDrop':
        case 'hold':
          return true;
      }

      if (success && newPiece) {
        const updatedPlayers = gameState.players.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              currentPiece: newPiece,
              board: newBoard,
              holdPiece: newHoldPiece,
              canHold: newCanHold,
            };
          }
          return p;
        });

        setLastPredictionTime(Date.now());
        setGameState({
          ...gameState,
          players: updatedPlayers as PlayerState[],
        });
      }

      return success;
    },
    [gameState, playerId, setGameState, setLastPredictionTime]
  );

  return {
    initLocalEngine,
    applyLocalAction,
  };
}

function canMove(board: Board, piece: Tetromino, dx: number, dy: number): boolean {
  if (!piece) return false;
  
  for (const block of piece.shape) {
    const newX = piece.position.x + block.x + dx;
    const newY = piece.position.y + block.y + dy;

    if (newX < 0 || newX >= 10) return false;
    if (newY < 0) return false;
    if (newY < board.length && board[newY]?.[newX] !== null) return false;
  }
  
  return true;
}
