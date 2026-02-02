import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  GameAction,
  Tetromino,
  Board,
  TetrominoType,
  RotationState,
  Position,
  TETROMINO_SHAPES,
  WALL_KICKS_JLSTZ,
  WALL_KICKS_I,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from '@3d-tetris/shared';

function getWallKicks(
  type: TetrominoType,
  fromRotation: RotationState,
  toRotation: RotationState
): Position[] {
  const key = `${fromRotation}->${toRotation}`;
  if (type === 'I') {
    return WALL_KICKS_I[key] || [{ x: 0, y: 0 }];
  }
  if (type === 'O') {
    return [{ x: 0, y: 0 }];
  }
  return WALL_KICKS_JLSTZ[key] || [{ x: 0, y: 0 }];
}

function canPlacePiece(board: Board, piece: Tetromino): boolean {
  for (const block of piece.shape) {
    const x = piece.position.x + block.x;
    const y = piece.position.y + block.y;

    if (x < 0 || x >= BOARD_WIDTH) return false;
    if (y < 0) return false;
    if (y < board.length && board[y]?.[x] !== null) return false;
  }
  return true;
}

function tryRotation(
  board: Board,
  piece: Tetromino,
  toRotation: RotationState
): { success: boolean; newPiece: Tetromino | null } {
  const type = piece.type;
  const fromRotation = piece.rotation;
  const kicks = getWallKicks(type, fromRotation, toRotation);
  const newShape = TETROMINO_SHAPES[type][toRotation];

  for (const kick of kicks) {
    const newPiece: Tetromino = {
      ...piece,
      rotation: toRotation,
      shape: newShape,
      position: {
        x: piece.position.x + kick.x,
        y: piece.position.y + kick.y,
      },
    };

    if (canPlacePiece(board, newPiece)) {
      return { success: true, newPiece };
    }
  }

  return { success: false, newPiece: null };
}

function getGhostY(board: Board, piece: Tetromino): number {
  let ghostY = piece.position.y;

  while (true) {
    const testPiece = {
      ...piece,
      position: { ...piece.position, y: ghostY - 1 },
    };

    if (!canPlacePiece(board, testPiece)) break;
    ghostY--;
  }

  return ghostY;
}

function createSpawnedPiece(type: TetrominoType): Tetromino {
  const spawnX = Math.floor((BOARD_WIDTH - 4) / 2);
  const spawnY = BOARD_HEIGHT;
  return {
    type,
    position: { x: spawnX, y: spawnY },
    rotation: 0 as RotationState,
    shape: TETROMINO_SHAPES[type][0],
  };
}

export function useLocalPrediction() {
  const applyLocalAction = useCallback((action: GameAction): boolean => {
    const { gameState, playerId, displayPiece, setDisplayPiece } = useGameStore.getState();
    
    if (!gameState || !playerId || !displayPiece) return false;

    const myState = gameState.players.find((p) => p.id === playerId);
    if (!myState?.isAlive) return false;

    let newPiece: Tetromino | null = { ...displayPiece };
    const board = myState.board;
    let success = false;

    switch (action.type) {
      case 'moveLeft':
        if (canMove(board, newPiece, -1, 0)) {
          newPiece = { ...newPiece, position: { ...newPiece.position, x: newPiece.position.x - 1 } };
          success = true;
        }
        break;

      case 'moveRight':
        if (canMove(board, newPiece, 1, 0)) {
          newPiece = { ...newPiece, position: { ...newPiece.position, x: newPiece.position.x + 1 } };
          success = true;
        }
        break;

      case 'softDrop':
      case 'moveDown':
        if (canMove(board, newPiece, 0, -1)) {
          newPiece = { ...newPiece, position: { ...newPiece.position, y: newPiece.position.y - 1 } };
          success = true;
        }
        break;

      case 'rotateCW': {
        const toRotation = ((newPiece.rotation + 1) % 4) as RotationState;
        const result = tryRotation(board, newPiece, toRotation);
        if (result.success && result.newPiece) {
          newPiece = result.newPiece;
          success = true;
        }
        break;
      }

      case 'rotateCCW': {
        const toRotation = ((newPiece.rotation + 3) % 4) as RotationState;
        const result = tryRotation(board, newPiece, toRotation);
        if (result.success && result.newPiece) {
          newPiece = result.newPiece;
          success = true;
        }
        break;
      }

      case 'rotate180': {
        const toRotation = ((newPiece.rotation + 2) % 4) as RotationState;
        const result = tryRotation(board, newPiece, toRotation);
        if (result.success && result.newPiece) {
          newPiece = result.newPiece;
          success = true;
        }
        break;
      }

      case 'hardDrop': {
        const nextPieceType = myState.nextPieces[0];
        if (nextPieceType) {
          const nextPiece = createSpawnedPiece(nextPieceType);
          setDisplayPiece(nextPiece);
        }
        return true;
      }

      case 'hold':
        return true;
    }

    if (success && newPiece) {
      setDisplayPiece(newPiece);
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

export { canPlacePiece, getGhostY };
