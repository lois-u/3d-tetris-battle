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
    const { gameState, playerId, pendingActions } = get();
    
    const serverMyState = serverState.players.find(p => p.id === playerId);
    const localMyState = gameState?.players.find(p => p.id === playerId);
    
    const localPiece = localMyState?.currentPiece;
    const serverPiece = serverMyState?.currentPiece;
    
    const pieceMismatch = !localPiece || !serverPiece || localPiece.type !== serverPiece.type;
    
    if (pieceMismatch) {
      set({ gameState: serverState, pendingActions: [] });
      return;
    }
    
    const now = Date.now();
    const PENDING_ACTION_TTL = 200;
    const validPendingActions = pendingActions.filter(
      pa => (now - pa.timestamp) < PENDING_ACTION_TTL
    );
    
    const hasPendingMovement = validPendingActions.some(
      pa => pa.action.type === 'moveLeft' || pa.action.type === 'moveRight' || 
            pa.action.type === 'moveDown' || pa.action.type === 'softDrop'
    );
    
    const hasPendingRotation = validPendingActions.some(
      pa => pa.action.type === 'rotateCW' || pa.action.type === 'rotateCCW' || 
            pa.action.type === 'rotate180'
    );
    
    const hasPendingHardDrop = validPendingActions.some(
      pa => pa.action.type === 'hardDrop'
    );
    
    const mergedPiece = {
      ...serverPiece,
      position: {
        x: hasPendingMovement || hasPendingRotation ? localPiece.position.x : serverPiece.position.x,
        y: hasPendingHardDrop ? localPiece.position.y : Math.min(localPiece.position.y, serverPiece.position.y)
      },
      rotation: hasPendingRotation ? localPiece.rotation : serverPiece.rotation,
      shape: hasPendingRotation ? localPiece.shape : serverPiece.shape,
    };
    
    const mergedPlayers = serverState.players.map(p => {
      if (p.id === playerId) {
        return { ...p, currentPiece: mergedPiece };
      }
      return p;
    });
    
    set({ 
      gameState: { ...serverState, players: mergedPlayers as PlayerState[] },
      pendingActions: validPendingActions
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
