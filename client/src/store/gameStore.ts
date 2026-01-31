import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  GameState,
  PlayerState,
  LobbyPlayer,
  RoomInfo,
  ServerToClientEvents,
  ClientToServerEvents,
} from '@3d-tetris/shared';

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
    }),
}));
