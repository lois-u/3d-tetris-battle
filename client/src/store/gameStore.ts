import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import {
  GameState,
  PlayerState,
  LobbyPlayer,
  RoomInfo,
  ServerToClientEvents,
  ClientToServerEvents,
  Tetromino,
  ChatMessage,
} from '@3d-tetris/shared';

interface SyncState {
  lastPieceType: string | null;
  lastBoardHash: string;
}

function hashBoard(board: (string | null)[][]): string {
  let hash = 0;
  for (let y = 0; y < Math.min(20, board.length); y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] !== null) {
        hash = ((hash << 5) - hash) + (y * 10 + x);
        hash |= 0;
      }
    }
  }
  return hash.toString(36);
}

type Screen = 'menu' | 'lobby' | 'room' | 'game' | 'gameOver' | 'soloGame' | 'soloGameOver';

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

  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;

  opponents: LobbyPlayer[];
  setOpponents: (opponents: LobbyPlayer[]) => void;

  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  setGameStateFromServer: (state: GameState) => void;

  displayPiece: Tetromino | null;
  setDisplayPiece: (piece: Tetromino | null) => void;
  syncState: SyncState;

  winner: string | null;
  setWinner: (winner: string | null) => void;

  pendingGarbage: { lines: number; from: string } | null;
  setPendingGarbage: (garbage: { lines: number; from: string } | null) => void;

  soloFinalScore: { score: number; level: number; lines: number } | null;
  setSoloFinalScore: (score: { score: number; level: number; lines: number } | null) => void;

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

  chatMessages: [],
  addChatMessage: (message) => set((state) => ({ 
    chatMessages: [...state.chatMessages.slice(-49), message] 
  })),
  clearChatMessages: () => set({ chatMessages: [] }),

  opponents: [],
  setOpponents: (opponents) => set({ opponents }),

  gameState: null,
  setGameState: (gameState) => set({ gameState }),

  displayPiece: null,
  setDisplayPiece: (displayPiece) => {
    const { gameState, playerId } = get();
    if (!gameState || !playerId) {
      set({ displayPiece });
      return;
    }
    const mergedPlayers = gameState.players.map(p => {
      if (p.id === playerId) {
        return { ...p, currentPiece: displayPiece };
      }
      return p;
    });
    set({ 
      displayPiece,
      gameState: { ...gameState, players: mergedPlayers as PlayerState[] }
    });
  },
  syncState: { lastPieceType: null, lastBoardHash: '' },
  
  setGameStateFromServer: (serverState) => {
    const { playerId, displayPiece, syncState } = get();

    const serverMyState = serverState.players.find(p => p.id === playerId);
    
    if (!serverMyState) {
      set({ 
        gameState: serverState, 
        displayPiece: null,
        syncState: { lastPieceType: null, lastBoardHash: '' },
      });
      return;
    }

    const serverPiece = serverMyState.currentPiece;
    const serverBoard = serverMyState.board;
    const currentBoardHash = hashBoard(serverBoard);

    const boardChanged = currentBoardHash !== syncState.lastBoardHash;
    const pieceChanged = serverPiece?.type !== syncState.lastPieceType;

    let shouldReset = false;

    if (!serverPiece) {
      shouldReset = true;
    } else if (!displayPiece) {
      shouldReset = true;
    } else if (pieceChanged) {
      shouldReset = true;
    } else if (boardChanged) {
      shouldReset = true;
    }

    const newSyncState: SyncState = {
      lastPieceType: serverPiece?.type ?? null,
      lastBoardHash: currentBoardHash,
    };

    let newDisplayPiece: Tetromino | null;

    if (shouldReset) {
      newDisplayPiece = serverPiece ? { ...serverPiece } : null;
    } else {
      newDisplayPiece = {
        ...displayPiece!,
        position: {
          x: displayPiece!.position.x,
          y: Math.min(displayPiece!.position.y, serverPiece!.position.y),
        },
      };
    }

    const mergedPlayers = serverState.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          board: serverBoard,
          currentPiece: newDisplayPiece,
        };
      }
      return p;
    });

    set({
      gameState: { ...serverState, players: mergedPlayers as PlayerState[] },
      displayPiece: newDisplayPiece,
      syncState: newSyncState,
    });
  },

  winner: null,
  setWinner: (winner) => set({ winner }),

  pendingGarbage: null,
  setPendingGarbage: (pendingGarbage) => set({ pendingGarbage }),

  soloFinalScore: null,
  setSoloFinalScore: (soloFinalScore) => set({ soloFinalScore }),

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
      displayPiece: null,
      syncState: { lastPieceType: null, lastBoardHash: '' },
      chatMessages: [],
      soloFinalScore: null,
    }),
}));
