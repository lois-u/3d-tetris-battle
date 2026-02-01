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
  RotationState,
  TETROMINO_SHAPES,
} from '@3d-tetris/shared';

interface PendingAction {
  action: GameAction;
  timestamp: number;
  expectedDelta: {
    x: number;
    rotation: number;
  };
  serverUpdatesSeen: number;
}

interface ServerStateSnapshot {
  x: number;
  y: number;
  rotation: number;
  pieceType: string;
}

function getActionDelta(action: GameAction): { x: number; rotation: number } {
  switch (action.type) {
    case 'moveLeft':
      return { x: -1, rotation: 0 };
    case 'moveRight':
      return { x: 1, rotation: 0 };
    case 'rotateCW':
      return { x: 0, rotation: 1 };
    case 'rotateCCW':
      return { x: 0, rotation: 3 };
    case 'rotate180':
      return { x: 0, rotation: 2 };
    default:
      return { x: 0, rotation: 0 };
  }
}

interface ReconciliationResult {
  displayPiece: Tetromino;
  remainingActions: PendingAction[];
}

function reconcileWithServer(
  serverPiece: Tetromino,
  localPiece: Tetromino | null,
  previousServerState: ServerStateSnapshot | null,
  pendingActions: PendingAction[]
): ReconciliationResult {
  if (!previousServerState || previousServerState.pieceType !== serverPiece.type) {
    return {
      displayPiece: serverPiece,
      remainingActions: [],
    };
  }

  if (pendingActions.length === 0) {
    return {
      displayPiece: serverPiece,
      remainingActions: [],
    };
  }

  const observedDeltaX = serverPiece.position.x - previousServerState.x;
  const observedDeltaRotation = ((serverPiece.rotation - previousServerState.rotation) + 4) % 4;

  const totalExpectedDeltaX = pendingActions.reduce(
    (sum, pa) => sum + pa.expectedDelta.x,
    0
  );
  const totalExpectedDeltaRotation = pendingActions.reduce(
    (sum, pa) => sum + pa.expectedDelta.rotation,
    0
  ) % 4;

  let updatedActions = pendingActions.map(pa => ({
    ...pa,
    serverUpdatesSeen: pa.serverUpdatesSeen + 1,
  }));

  let consumedXDelta = 0;
  if (totalExpectedDeltaX !== 0) {
    if (observedDeltaX === 0) {
      consumedXDelta = 0;
    } else if (Math.sign(observedDeltaX) === Math.sign(totalExpectedDeltaX)) {
      consumedXDelta = Math.sign(observedDeltaX) * 
        Math.min(Math.abs(observedDeltaX), Math.abs(totalExpectedDeltaX));
    } else {
      consumedXDelta = totalExpectedDeltaX;
    }
  }

  let consumedRotationDelta = 0;
  if (totalExpectedDeltaRotation !== 0) {
    if (observedDeltaRotation === 0) {
      consumedRotationDelta = 0;
    } else if (observedDeltaRotation === totalExpectedDeltaRotation) {
      consumedRotationDelta = observedDeltaRotation;
    } else {
      consumedRotationDelta = Math.min(observedDeltaRotation, totalExpectedDeltaRotation);
    }
  }

  let xConsumedSoFar = 0;
  let rotationConsumedSoFar = 0;
  
  updatedActions = updatedActions.filter(pa => {
    if (pa.expectedDelta.x !== 0) {
      if (Math.sign(pa.expectedDelta.x) === Math.sign(consumedXDelta) &&
          Math.abs(xConsumedSoFar) < Math.abs(consumedXDelta)) {
        xConsumedSoFar += pa.expectedDelta.x;
        return false;
      }
    }
    
    if (pa.expectedDelta.rotation !== 0) {
      if (rotationConsumedSoFar < consumedRotationDelta) {
        rotationConsumedSoFar += pa.expectedDelta.rotation;
        return false;
      }
    }
    
    return true;
  });

  const MAX_SERVER_UPDATES = 10;
  updatedActions = updatedActions.filter(pa => pa.serverUpdatesSeen < MAX_SERVER_UPDATES);

  const remainingDeltaX = updatedActions.reduce(
    (sum, pa) => sum + pa.expectedDelta.x,
    0
  );
  const remainingDeltaRotation = updatedActions.reduce(
    (sum, pa) => sum + pa.expectedDelta.rotation,
    0
  ) % 4;

  let displayX = serverPiece.position.x + remainingDeltaX;
  
  let displayY = serverPiece.position.y;
  const hasPendingHardDrop = updatedActions.some(pa => pa.action.type === 'hardDrop');
  if (hasPendingHardDrop && localPiece) {
    displayY = localPiece.position.y;
  } else if (localPiece) {
    displayY = Math.min(localPiece.position.y, serverPiece.position.y);
  }

  const displayRotation = ((serverPiece.rotation + remainingDeltaRotation) % 4) as RotationState;
  
  const displayShape = remainingDeltaRotation > 0
    ? TETROMINO_SHAPES[serverPiece.type][displayRotation]
    : serverPiece.shape;

  const displayPiece: Tetromino = {
    ...serverPiece,
    position: {
      x: displayX,
      y: displayY,
    },
    rotation: displayRotation,
    shape: displayShape,
  };

  return {
    displayPiece,
    remainingActions: updatedActions,
  };
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

  previousServerState: ServerStateSnapshot | null;

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
    const { gameState, playerId, pendingActions, previousServerState } = get();

    const serverMyState = serverState.players.find(p => p.id === playerId);
    const localMyState = gameState?.players.find(p => p.id === playerId);

    const serverPiece = serverMyState?.currentPiece;
    const localPiece = localMyState?.currentPiece;

    if (!serverPiece) {
      set({ 
        gameState: serverState, 
        pendingActions: [],
        previousServerState: null,
      });
      return;
    }

    const result = reconcileWithServer(
      serverPiece,
      localPiece ?? null,
      previousServerState,
      pendingActions
    );

    const newPreviousServerState: ServerStateSnapshot = {
      x: serverPiece.position.x,
      y: serverPiece.position.y,
      rotation: serverPiece.rotation,
      pieceType: serverPiece.type,
    };

    const mergedPlayers = serverState.players.map(p => {
      if (p.id === playerId) {
        return { ...p, currentPiece: result.displayPiece };
      }
      return p;
    });

    set({
      gameState: { ...serverState, players: mergedPlayers as PlayerState[] },
      pendingActions: result.remainingActions,
      previousServerState: newPreviousServerState,
    });
  },

  pendingActions: [],
  previousServerState: null,
  
  addPendingAction: (action) => {
    const { pendingActions } = get();
    const newPendingAction: PendingAction = {
      action,
      timestamp: Date.now(),
      expectedDelta: getActionDelta(action),
      serverUpdatesSeen: 0,
    };
    set({
      pendingActions: [...pendingActions, newPendingAction],
    });
  },
  
  clearPendingActions: () => set({ pendingActions: [], previousServerState: null }),

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
      previousServerState: null,
    }),
}));
