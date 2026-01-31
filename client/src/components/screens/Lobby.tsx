import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG } from '@3d-tetris/shared';

export default function Lobby() {
  const {
    socket,
    playerId,
    playerName,
    lobbyPlayers,
    availableRooms,
    isSearching,
    setIsSearching,
    setScreen,
  } = useGameStore();

  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState(4);

  const handleCreateRoom = () => {
    socket?.emit('createRoom', { maxPlayers: selectedMaxPlayers });
  };

  const handleJoinRoom = (roomId: string) => {
    socket?.emit('joinRoom', { roomId });
  };

  const handleQuickMatch = () => {
    socket?.emit('findMatch', { maxPlayers: selectedMaxPlayers });
    setIsSearching(true);
  };

  const handleCancelMatch = () => {
    socket?.emit('cancelMatch');
    setIsSearching(false);
  };

  const handleBack = () => {
    socket?.emit('leaveLobby');
    setScreen('menu');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <button type="button" onClick={handleBack} className="btn-secondary">
            ← 뒤로
          </button>
          <h1 className="text-4xl font-bold text-cyan-400 glow-text">로비</h1>
          <div className="w-24" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="panel-glow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">플레이어</p>
                <p className="text-xl font-bold text-white">{playerName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400">온라인</span>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="playerCount" className="block text-gray-400 text-sm mb-2">
                최대 인원
              </label>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedMaxPlayers(num)}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                      selectedMaxPlayers === num
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {isSearching ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xl text-cyan-400">검색 중...</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelMatch}
                  className="btn-secondary block mx-auto"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button type="button" onClick={handleQuickMatch} className="btn-primary w-full">
                  빠른 대전
                </button>
                <button type="button" onClick={handleCreateRoom} className="btn-secondary w-full">
                  방 만들기
                </button>
              </div>
            )}
          </div>

          <div className="panel p-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4">
              대기 중인 방 ({availableRooms.length})
            </h2>

            {availableRooms.length === 0 ? (
              <p className="text-gray-500 text-center py-8">대기 중인 방이 없습니다</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {room.players[0]?.name || '알 수 없음'}의 방
                      </p>
                      <p className="text-sm text-gray-400">
                        {room.players.length}/{room.maxPlayers}명
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={room.players.length >= room.maxPlayers}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        room.players.length >= room.maxPlayers
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                    >
                      참가
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel p-6 mt-6">
          <h2 className="text-xl font-bold text-purple-400 mb-4">
            온라인 플레이어 ({lobbyPlayers.length})
          </h2>

          {lobbyPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">온라인 플레이어가 없습니다</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lobbyPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    player.id === playerId
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'bg-white/5'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      player.status === 'idle'
                        ? 'bg-green-500'
                        : player.status === 'searching'
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className={player.id === playerId ? 'text-cyan-400' : 'text-white'}>
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
