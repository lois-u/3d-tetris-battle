import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  LobbyPlayer,
  GameAction,
  GAME_CONFIG,
  RoomInfo,
} from '@3d-tetris/shared';
import { GameRoom } from './GameRoom.js';

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.json({ status: 'ok', players: lobbyPlayers.size, rooms: gameRooms.size });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const lobbyPlayers = new Map<string, LobbyPlayer>();
const gameRooms = new Map<string, GameRoom>();
const playerToRoom = new Map<string, string>();

interface MatchmakingEntry {
  playerId: string;
  maxPlayers: number;
  timestamp: number;
}

const matchmakingQueue: MatchmakingEntry[] = [];

function getWaitingRooms(): RoomInfo[] {
  const rooms: RoomInfo[] = [];
  for (const room of gameRooms.values()) {
    if (room.getStatus() === 'waiting') {
      rooms.push(room.getRoomInfo());
    }
  }
  return rooms;
}

function broadcastLobbyUpdate(): void {
  const players = Array.from(lobbyPlayers.values());
  const rooms = getWaitingRooms();
  io.emit('lobbyUpdate', { players, rooms });
}

function createGameRoom(players: LobbyPlayer[], maxPlayers: number): GameRoom {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const room = new GameRoom(roomId, players, maxPlayers, io);
  gameRooms.set(roomId, room);

  for (const player of players) {
    playerToRoom.set(player.id, roomId);
    player.status = 'inGame';
    const socket = io.sockets.sockets.get(player.id);
    socket?.join(roomId);
  }

  return room;
}

function tryMatchmaking(): void {
  if (matchmakingQueue.length < GAME_CONFIG.minPlayers) return;

  const groupedByMax = new Map<number, MatchmakingEntry[]>();

  for (const entry of matchmakingQueue) {
    const group = groupedByMax.get(entry.maxPlayers) || [];
    group.push(entry);
    groupedByMax.set(entry.maxPlayers, group);
  }

  for (const [maxPlayers, entries] of groupedByMax) {
    if (entries.length >= maxPlayers) {
      const matchedEntries = entries.slice(0, maxPlayers);
      const matchedPlayers: LobbyPlayer[] = [];

      for (const entry of matchedEntries) {
        const player = lobbyPlayers.get(entry.playerId);
        if (player) {
          matchedPlayers.push(player);
          const idx = matchmakingQueue.findIndex(e => e.playerId === entry.playerId);
          if (idx !== -1) matchmakingQueue.splice(idx, 1);
        }
      }

      if (matchedPlayers.length >= GAME_CONFIG.minPlayers) {
        const room = createGameRoom(matchedPlayers, maxPlayers);

        for (const player of matchedPlayers) {
          const opponents = matchedPlayers.filter(p => p.id !== player.id);
          const socket = io.sockets.sockets.get(player.id);
          socket?.emit('matchFound', { roomId: room.getId(), opponents });
        }

        room.startCountdown();
        broadcastLobbyUpdate();
      }
    }
  }

  const now = Date.now();
  for (const [maxPlayers, entries] of groupedByMax) {
    const readyEntries = entries.filter(e => now - e.timestamp >= GAME_CONFIG.matchmakingTimeout);
    
    if (readyEntries.length >= GAME_CONFIG.minPlayers) {
      const matchedPlayers: LobbyPlayer[] = [];

      for (const entry of readyEntries) {
        const player = lobbyPlayers.get(entry.playerId);
        if (player) {
          matchedPlayers.push(player);
          const idx = matchmakingQueue.findIndex(e => e.playerId === entry.playerId);
          if (idx !== -1) matchmakingQueue.splice(idx, 1);
        }
      }

      if (matchedPlayers.length >= GAME_CONFIG.minPlayers) {
        const room = createGameRoom(matchedPlayers, matchedPlayers.length);

        for (const player of matchedPlayers) {
          const opponents = matchedPlayers.filter(p => p.id !== player.id);
          const socket = io.sockets.sockets.get(player.id);
          socket?.emit('matchFound', { roomId: room.getId(), opponents });
        }

        room.startCountdown();
        broadcastLobbyUpdate();
      }
    }
  }
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  socket.emit('connected', { playerId: socket.id });

  socket.on('joinLobby', ({ playerName }) => {
    const player: LobbyPlayer = {
      id: socket.id,
      name: playerName || `Player_${socket.id.slice(0, 4)}`,
      status: 'idle',
    };
    lobbyPlayers.set(socket.id, player);
    broadcastLobbyUpdate();
  });

  socket.on('leaveLobby', () => {
    lobbyPlayers.delete(socket.id);
    const queueIndex = matchmakingQueue.findIndex(e => e.playerId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }
    broadcastLobbyUpdate();
  });

  socket.on('createRoom', ({ maxPlayers }) => {
    const player = lobbyPlayers.get(socket.id);
    if (!player || player.status !== 'idle') return;

    const clampedMax = Math.min(Math.max(maxPlayers, GAME_CONFIG.minPlayers), GAME_CONFIG.maxPlayers);
    const room = createGameRoom([player], clampedMax);

    socket.emit('roomCreated', { room: room.getRoomInfo() });
    broadcastLobbyUpdate();
  });

  socket.on('joinRoom', ({ roomId }) => {
    const player = lobbyPlayers.get(socket.id);
    if (!player || player.status !== 'idle') return;

    const room = gameRooms.get(roomId);
    if (!room || room.getStatus() !== 'waiting' || room.isFull()) {
      socket.emit('error', 'Cannot join room');
      return;
    }

    if (room.addPlayer(player)) {
      playerToRoom.set(socket.id, roomId);
      player.status = 'inGame';
      socket.join(roomId);
      
      const roomInfo = room.getRoomInfo();
      socket.emit('roomJoined', { room: roomInfo });
      io.to(roomId).emit('roomUpdate', { room: roomInfo });
      broadcastLobbyUpdate();

      if (room.isFull()) {
        const players = room.getPlayers();
        for (const p of players) {
          const opponents = players.filter(op => op.id !== p.id);
          io.to(p.id).emit('matchFound', { roomId, opponents });
        }
        room.startCountdown();
      }
    }
  });

  socket.on('leaveRoom', () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (room && room.getStatus() === 'waiting') {
      room.removePlayer(socket.id);
      socket.leave(roomId);
      playerToRoom.delete(socket.id);

      const player = lobbyPlayers.get(socket.id);
      if (player) {
        player.status = 'idle';
      }

      if (room.getPlayerCount() === 0) {
        room.cleanup();
        gameRooms.delete(roomId);
      } else {
        io.to(roomId).emit('roomUpdate', { room: room.getRoomInfo() });
      }

      broadcastLobbyUpdate();
    }
  });

  socket.on('sendChat', ({ message }) => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (!room || room.getStatus() !== 'waiting') return;

    const player = lobbyPlayers.get(socket.id);
    if (!player) return;

    const trimmedMessage = message.trim().slice(0, 200);
    if (!trimmedMessage) return;

    const chatMessage = {
      id: `${socket.id}-${Date.now()}`,
      playerId: socket.id,
      playerName: player.name,
      message: trimmedMessage,
      timestamp: Date.now(),
    };

    io.to(roomId).emit('chatMessage', { message: chatMessage });
  });

  socket.on('findMatch', (data) => {
    const player = lobbyPlayers.get(socket.id);
    if (player && player.status === 'idle') {
      player.status = 'searching';
      const maxPlayers = data?.maxPlayers ?? GAME_CONFIG.maxPlayers;
      const clampedMax = Math.min(Math.max(maxPlayers, GAME_CONFIG.minPlayers), GAME_CONFIG.maxPlayers);
      
      matchmakingQueue.push({
        playerId: socket.id,
        maxPlayers: clampedMax,
        timestamp: Date.now(),
      });
      
      broadcastLobbyUpdate();
      tryMatchmaking();
    }
  });

  socket.on('cancelMatch', () => {
    const player = lobbyPlayers.get(socket.id);
    if (player && player.status === 'searching') {
      player.status = 'idle';
      const queueIndex = matchmakingQueue.findIndex(e => e.playerId === socket.id);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }
      broadcastLobbyUpdate();
    }
  });

  socket.on('startGame', () => {
    const roomId = playerToRoom.get(socket.id);
    if (!roomId) return;

    const room = gameRooms.get(roomId);
    if (room && room.canStart()) {
      const players = room.getPlayers();
      for (const p of players) {
        const opponents = players.filter(op => op.id !== p.id);
        io.to(p.id).emit('matchFound', { roomId, opponents });
      }
      room.startCountdown();
      broadcastLobbyUpdate();
    }
  });

  socket.on('ready', () => {
    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = gameRooms.get(roomId);
      room?.setPlayerReady(socket.id);
    }
  });

  socket.on('gameAction', (action: GameAction) => {
    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = gameRooms.get(roomId);
      room?.handleAction(socket.id, action);
    }
  });

  socket.on('surrender', () => {
    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = gameRooms.get(roomId);
      room?.handleSurrender(socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    const roomId = playerToRoom.get(socket.id);
    if (roomId) {
      const room = gameRooms.get(roomId);
      if (room) {
        room.handleDisconnect(socket.id);
        if (room.getPlayerCount() === 0 || room.getStatus() === 'finished') {
          room.cleanup();
          gameRooms.delete(roomId);
        }
      }
      playerToRoom.delete(socket.id);
    }

    lobbyPlayers.delete(socket.id);
    const queueIndex = matchmakingQueue.findIndex(e => e.playerId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
    }
    broadcastLobbyUpdate();
  });
});

setInterval(tryMatchmaking, 5000);

const PORT = process.env.PORT || 3001;

httpServer.listen(Number(PORT), () => {
  console.log(`Server running on port ${PORT}`);
});
