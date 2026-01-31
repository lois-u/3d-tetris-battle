// ============================================
// 3D Tetris Battle - Shared Types & Constants
// ============================================

// ===================
// Tetromino Types
// ===================
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Position {
  x: number;
  y: number;
}

export interface Position3D extends Position {
  z: number;
}

// Each tetromino shape is defined as relative positions from pivot
export type TetrominoShape = Position[];

// Rotation states: 0 = spawn, 1 = CW, 2 = 180, 3 = CCW
export type RotationState = 0 | 1 | 2 | 3;

export interface Tetromino {
  type: TetrominoType;
  position: Position;
  rotation: RotationState;
  shape: TetrominoShape;
}

// ===================
// Board Configuration
// ===================
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const BOARD_VISIBLE_HEIGHT = 20;
export const BOARD_BUFFER_HEIGHT = 4; // Extra rows above visible area

// Cell states: null = empty, string = tetromino type (for color)
export type Cell = TetrominoType | null;
export type Board = Cell[][];

// ===================
// Tetromino Definitions (SRS Standard)
// ===================
export const TETROMINO_SHAPES: Record<TetrominoType, TetrominoShape[]> = {
  I: [
    // 0 (spawn)
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    // 1 (CW)
    [{ x: 2, y: -1 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    // 2 (180)
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    // 3 (CCW)
    [{ x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  O: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  ],
  T: [
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  S: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  Z: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
  ],
  J: [
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  ],
  L: [
    [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
};

// ===================
// SRS Wall Kick Data
// ===================
// Wall kick tests for JLSTZ pieces
export const WALL_KICKS_JLSTZ: Record<string, Position[]> = {
  '0->1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '1->0': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '1->2': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '2->1': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '2->3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '3->2': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '3->0': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '0->3': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
};

// Wall kick tests for I piece
export const WALL_KICKS_I: Record<string, Position[]> = {
  '0->1': [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  '1->0': [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  '1->2': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
  '2->1': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '2->3': [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  '3->2': [{ x: 0, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  '3->0': [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '0->3': [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
};

// ===================
// Color Definitions
// ===================
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0', // Cyan
  O: '#f0f000', // Yellow
  T: '#a000f0', // Purple
  S: '#00f000', // Green
  Z: '#f00000', // Red
  J: '#0000f0', // Blue
  L: '#f0a000', // Orange
};

export const TETROMINO_EMISSIVE_COLORS: Record<TetrominoType, string> = {
  I: '#00a0a0',
  O: '#a0a000',
  T: '#7000a0',
  S: '#00a000',
  Z: '#a00000',
  J: '#0000a0',
  L: '#a07000',
};

// ===================
// Game State
// ===================
export interface PlayerState {
  id: string;
  name: string;
  board: Board;
  currentPiece: Tetromino | null;
  holdPiece: TetrominoType | null;
  canHold: boolean;
  nextPieces: TetrominoType[];
  score: number;
  level: number;
  linesCleared: number;
  combo: number;
  backToBack: boolean;
  isAlive: boolean;
  pendingGarbage: number;
}

export interface GameState {
  id: string;
  players: PlayerState[];
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  countdown: number;
  winner: string | null;
  startTime: number | null;
}

// ===================
// Socket Events
// ===================
export interface RoomInfo {
  id: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
}

export interface ServerToClientEvents {
  connected: (data: { playerId: string }) => void;
  error: (message: string) => void;

  lobbyUpdate: (data: { players: LobbyPlayer[]; rooms: RoomInfo[] }) => void;
  roomCreated: (data: { room: RoomInfo }) => void;
  roomJoined: (data: { room: RoomInfo }) => void;
  roomUpdate: (data: { room: RoomInfo }) => void;
  matchFound: (data: { roomId: string; opponents: LobbyPlayer[] }) => void;

  gameState: (state: GameState) => void;
  gameStart: (state: GameState) => void;
  gameUpdate: (state: GameState) => void;
  gameOver: (data: { winner: string; reason: string }) => void;
  
  garbageReceived: (data: { lines: number; fromPlayer: string }) => void;
  garbageIncoming: (data: { lines: number; fromPlayer: string }) => void;
}

export interface ClientToServerEvents {
  joinLobby: (data: { playerName: string }) => void;
  leaveLobby: () => void;
  createRoom: (data: { maxPlayers: number }) => void;
  joinRoom: (data: { roomId: string }) => void;
  leaveRoom: () => void;
  findMatch: (data?: { maxPlayers?: number }) => void;
  cancelMatch: () => void;
  startGame: () => void;

  ready: () => void;
  gameAction: (action: GameAction) => void;
  surrender: () => void;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  status: 'idle' | 'searching' | 'inGame';
}

// ===================
// Game Actions
// ===================
export type GameAction =
  | { type: 'moveLeft' }
  | { type: 'moveRight' }
  | { type: 'softDrop' }
  | { type: 'hardDrop' }
  | { type: 'rotateCW' }
  | { type: 'rotateCCW' }
  | { type: 'rotate180' }
  | { type: 'hold' };

// ===================
// Scoring
// ===================
export const SCORE_TABLE = {
  // Lines cleared
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  
  // T-Spin bonuses
  tSpinMini: 100,
  tSpinMiniSingle: 200,
  tSpin: 400,
  tSpinSingle: 800,
  tSpinDouble: 1200,
  tSpinTriple: 1600,
  
  // Multipliers
  softDropPerCell: 1,
  hardDropPerCell: 2,
  comboBonus: 50, // per combo count
  backToBackMultiplier: 1.5,
  perfectClear: 3000,
} as const;

// ===================
// Garbage Line System
// ===================
export const GARBAGE_TABLE = {
  single: 0,
  double: 1,
  triple: 2,
  tetris: 4,
  tSpinMini: 0,
  tSpinMiniSingle: 0,
  tSpinSingle: 2,
  tSpinDouble: 4,
  tSpinTriple: 6,
  perfectClear: 10,
  comboTable: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5], // Garbage per combo count
  backToBackBonus: 1,
} as const;

// ===================
// Game Configuration
// ===================
export const GAME_CONFIG = {
  // Timing (in ms)
  lockDelay: 500,
  lockMoves: 15,
  lineClearDelay: 200,
  entryDelay: 100,
  
  // DAS (Delayed Auto Shift)
  das: 133,
  arr: 10,
  
  // Soft drop
  sdf: 20,
  
  // Gravity (cells per second at level 1)
  baseGravity: 1,
  gravityIncrease: 0.1,
  maxGravity: 20,
  
  // Next queue size
  nextQueueSize: 5,
  
  countdownSeconds: 3,
  
  minPlayers: 2,
  maxPlayers: 8,
  matchmakingTimeout: 30000,
} as const;

// ===================
// Utility Types
// ===================
export interface LineClearResult {
  linesCleared: number;
  isTetris: boolean;
  isTSpin: boolean;
  isTSpinMini: boolean;
  isPerfectClear: boolean;
  garbageToSend: number;
  scoreGained: number;
}

export interface MoveResult {
  success: boolean;
  wallKickUsed?: Position;
  isTSpin?: boolean;
  isTSpinMini?: boolean;
}

// ===================
// Random Generator (7-bag)
// ===================
export function createBag(): TetrominoType[] {
  const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  // Fisher-Yates shuffle
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

// ===================
// Board Utilities
// ===================
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT + BOARD_BUFFER_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(null)
  );
}

export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

export { TetrisEngine } from './game/TetrisEngine.js';
