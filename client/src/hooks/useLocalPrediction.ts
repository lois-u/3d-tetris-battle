import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  GameAction,
  PlayerState,
  Tetromino,
  Board,
} from '@3d-tetris/shared';

export function useLocalPrediction() {
  const applyLocalAction = useCallback((action: GameAction): boolean => {
    const { gameState, playerId, setGameState, addPendingAction } = useGameStore.getState();
    
    if (!gameState || !playerId) return false;

    const myState = gameState.players.find((p) => p.id === playerId);
    if (!myState?.isAlive || !myState.currentPiece) return false;

    let newPiece: Tetromino | null = { ...myState.currentPiece };
    const newBoard = myState.board;
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
      case 'moveDown':
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
        useGameStore.getState().clearPendingActions();
        return true;
    }

    if (success && newPiece) {
      const updatedPlayers = gameState.players.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            currentPiece: newPiece,
          };
        }
        return p;
      });

      addPendingAction(action);
      setGameState({
        ...gameState,
        players: updatedPlayers as PlayerState[],
      });
    }

    return success;
  }, []);

  return { applyLocalAction };
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
