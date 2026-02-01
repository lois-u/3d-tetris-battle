import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001`;
  }
  return 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

export function useSocket() {
  const {
    setSocket,
    setPlayerId,
    setLobbyPlayers,
    setAvailableRooms,
    setRoomId,
    setCurrentRoom,
    setOpponents,
    setGameState,
    setGameStateFromServer,
    setWinner,
    setScreen,
    setIsSearching,
    setPendingGarbage,
  } = useGameStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
    });

    setSocket(socket);

    socket.on('connected', ({ playerId }) => {
      setPlayerId(playerId);
    });

    socket.on('lobbyUpdate', ({ players, rooms }) => {
      setLobbyPlayers(players);
      setAvailableRooms(rooms);
    });

    socket.on('roomCreated', ({ room }) => {
      setRoomId(room.id);
      setCurrentRoom(room);
      setScreen('room');
    });

    socket.on('roomJoined', ({ room }) => {
      setRoomId(room.id);
      setCurrentRoom(room);
      setScreen('room');
    });

    socket.on('roomUpdate', ({ room }) => {
      setCurrentRoom(room);
    });

    socket.on('matchFound', ({ roomId, opponents }) => {
      setRoomId(roomId);
      setOpponents(opponents);
      setIsSearching(false);
      setScreen('game');
    });

    socket.on('gameStart', (state) => {
      setGameState(state);
    });

    socket.on('gameUpdate', (state) => {
      setGameStateFromServer(state);
    });

    socket.on('gameOver', ({ winner }) => {
      setWinner(winner);
      setScreen('gameOver');
    });

    socket.on('garbageIncoming', ({ lines, fromPlayer }) => {
      setPendingGarbage({ lines, from: fromPlayer });
      setTimeout(() => setPendingGarbage(null), 2000);
    });

    socket.on('error', (message) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, []);
}
