import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  GameState,
  PlayerState,
  LobbyPlayer,
  RoomInfo,
  ServerToClientEvents,
  ClientToServerEvents,
  GameAction,
  Tetromino,
  Board,
} from '@3d-tetris/shared';

interface PendingAction {
  action: GameAction;
  timestamp: number;
}

type Screen = 'menu' | 'lobby' | 'room' | 'game' | 'gameOver';

interface GameStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;

  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  setSocket: (socket: Socket<ServerToClientEvents, ClientToServerEvents> | null) => void;

  playerId: string | null;
  setPlayerId: (id: string | null) => void;

  playerName: string;
  setPlayerName: (name: string) => void;

  lobbyPlayers: LobbyPlayer[];
  setLobbyPlayers: (players: LobbyPlayer[]) => void;

  availableRooms: RoomInfo[];
  setAvailableRooms: (rooms: RoomInfo[]) => void;

  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;

  roomId: string | null;
  setRoomId: (roomId: string | null) => void;

  currentRoom: RoomInfo | null;
  setCurrentRoom: (room: RoomInfo | null) => void;

  opponents: LobbyPlayer[];
  setOpponents: (opponents: LobbyPlayer[]) => void;

  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  setGameStateFromServer: (state: GameState) => void;

  pendingActions: PendingAction[];
  addPendingAction: (action: GameAction) => void;
  clearPendingActions: () => void;

  winner: string | null;
  setWinner: (winner: string | null) => void;

  pendingGarbage: { lines: number; from: string } | null;
  setPendingGarbage: (garbage: { lines: number; from: string } | null) => void;

  getMyState: () => PlayerState | null;
  getOpponentStates: () => PlayerState[];

  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'menu',
  setScreen: (screen) => set({ screen }),

  socket: null,
  setSocket: (socket) => set({ socket }),

  playerId: null,
  setPlayerId: (playerId) => set({ playerId }),

  playerName: '',
  setPlayerName: (playerName) => set({ playerName }),

  lobbyPlayers: [],
  setLobbyPlayers: (lobbyPlayers) => set({ lobbyPlayers }),

  availableRooms: [],
  setAvailableRooms: (availableRooms) => set({ availableRooms }),

  isSearching: false,
  setIsSearching: (isSearching) => set({ isSearching }),

  roomId: null,
  setRoomId: (roomId) => set({ roomId }),

  currentRoom: null,
  setCurrentRoom: (currentRoom) => set({ currentRoom }),

  opponents: [],
  setOpponents: (opponents) => set({ opponents }),

  gameState: null,
  setGameState: (gameState) => set({ gameState }),
  setGameStateFromServer: (serverState) => {
    const { pendingActions, playerId } = get();
    const now = Date.now();
    
    // 500ms 이상 지난 액션 제거
    const validActions = pendingActions.filter(a => now - a.timestamp < 500);
    
    // 내 플레이어 상태 찾기
    const serverMyState = serverState.players.find(p => p.id === playerId);
    
    // pending actions가 없거나 피스가 없으면 서버 상태 그대로 사용
    if (!serverMyState?.currentPiece || validActions.length === 0) {
      set({ gameState: serverState, pendingActions: [] });
      return;
    }
    
    // 서버 피스에서 시작해서 pending actions 재적용
    let piece: Tetromino = { ...serverMyState.currentPiece };
    const board = serverMyState.board;
    const actionsToKeep: PendingAction[] = [];
    
    for (const pendingAction of validActions) {
      const { action } = pendingAction;
      let applied = false;
      
      switch (action.type) {
        case 'moveLeft':
          if (canMoveInStore(board, piece, -1, 0)) {
            piece = { ...piece, position: { ...piece.position, x: piece.position.x - 1 } };
            applied = true;
          }
          break;
        case 'moveRight':
          if (canMoveInStore(board, piece, 1, 0)) {
            piece = { ...piece, position: { ...piece.position, x: piece.position.x + 1 } };
            applied = true;
          }
          break;
        case 'moveDown':
          if (canMoveInStore(board, piece, 0, -1)) {
            piece = { ...piece, position: { ...piece.position, y: piece.position.y - 1 } };
            applied = true;
          }
          break;
      }
      
      // 적용된 액션만 유지
      if (applied) {
        actionsToKeep.push(pendingAction);
      }
    }
    
    // 재적용된 피스 위치로 상태 업데이트
    const mergedPlayers = serverState.players.map(p => {
      if (p.id === playerId) {
        return { ...p, currentPiece: piece };
      }
      return p;
    });
    
    set({ 
      gameState: { ...serverState, players: mergedPlayers as PlayerState[] },
      pendingActions: actionsToKeep
    });
  },

  pendingActions: [],
  addPendingAction: (action) => {
    const { pendingActions } = get();
    set({ 
      pendingActions: [...pendingActions, { action, timestamp: Date.now() }]
    });
  },
  clearPendingActions: () => set({ pendingActions: [] }),

  winner: null,
  setWinner: (winner) => set({ winner }),

  pendingGarbage: null,
  setPendingGarbage: (pendingGarbage) => set({ pendingGarbage }),

  getMyState: () => {
    const { gameState, playerId } = get();
    if (!gameState || !playerId) return null;
    return gameState.players.find((p) => p.id === playerId) || null;
  },

  getOpponentStates: () => {
    const { gameState, playerId } = get();
    if (!gameState || !playerId) return [];
    return gameState.players.filter((p) => p.id !== playerId);
  },

  reset: () =>
    set({
      screen: 'menu',
      roomId: null,
      currentRoom: null,
      opponents: [],
      gameState: null,
      winner: null,
      isSearching: false,
      pendingGarbage: null,
      availableRooms: [],
      pendingActions: [],
    }),
}));

function canMoveInStore(board: Board, piece: Tetromino, dx: number, dy: number): boolean {
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
