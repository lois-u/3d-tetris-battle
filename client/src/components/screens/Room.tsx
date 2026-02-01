import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG } from '@3d-tetris/shared';

export default function Room() {
  const {
    socket,
    playerId,
    currentRoom,
    chatMessages,
    setScreen,
    setCurrentRoom,
    setRoomId,
    clearChatMessages,
  } = useGameStore();

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleLeaveRoom = () => {
    socket?.emit('leaveRoom');
    setCurrentRoom(null);
    setRoomId(null);
    clearChatMessages();
    setScreen('lobby');
  };

  const handleStartGame = () => {
    socket?.emit('startGame');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || !socket) return;
    socket.emit('sendChat', { message });
    setChatInput('');
  };

  if (!currentRoom) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-xl text-gray-400">Loading room...</p>
      </div>
    );
  }

  const canStart = currentRoom.players.length >= GAME_CONFIG.minPlayers;
  const isHost = currentRoom.players[0]?.id === playerId;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={handleLeaveRoom} className="btn-secondary">
            ← Leave
          </button>
          <h1 className="text-4xl font-bold text-cyan-400 glow-text">GAME ROOM</h1>
          <div className="w-24" />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 panel-glow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Room ID</p>
                <p className="text-lg font-mono text-white">{currentRoom.id.slice(0, 12)}...</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Players</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {currentRoom.players.length} / {currentRoom.maxPlayers}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {Array.from({ length: currentRoom.maxPlayers }).map((_, index) => {
                const player = currentRoom.players[index];
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-center ${
                      player
                        ? player.id === playerId
                          ? 'bg-cyan-500/30 border-2 border-cyan-500'
                          : 'bg-purple-500/20 border border-purple-500/50'
                        : 'bg-white/5 border border-dashed border-gray-600'
                    }`}
                  >
                    {player ? (
                      <>
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-white truncate">{player.name}</p>
                        {index === 0 && (
                          <span className="text-xs text-yellow-400">HOST</span>
                        )}
                        {player.id === playerId && index !== 0 && (
                          <span className="text-xs text-cyan-400">YOU</span>
                        )}
                      </>
                    ) : (
                      <div className="py-4">
                        <p className="text-gray-500 text-sm">Waiting...</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isHost ? (
              <button
                type="button"
                onClick={handleStartGame}
                disabled={!canStart}
                className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${
                  canStart
                    ? 'btn-primary'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canStart ? 'START GAME' : `Need ${GAME_CONFIG.minPlayers - currentRoom.players.length} more player(s)`}
              </button>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-lg text-cyan-400">Waiting for host to start...</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-72 panel-glow p-4 flex flex-col">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">Chat</h3>
            
            <div className="flex-1 overflow-y-auto mb-3 space-y-2 min-h-[200px] max-h-[300px]">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No messages yet</p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`text-sm ${msg.playerId === playerId ? 'text-right' : ''}`}
                  >
                    <span className={`font-semibold ${msg.playerId === playerId ? 'text-cyan-400' : 'text-purple-400'}`}>
                      {msg.playerName}
                    </span>
                    <p className="text-white break-words">{msg.message}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 px-3 py-2 bg-white/10 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold text-sm transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
