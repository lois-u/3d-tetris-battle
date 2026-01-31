import { useGameStore } from '../../store/gameStore';
import { GAME_CONFIG } from '@3d-tetris/shared';

export default function Room() {
  const {
    socket,
    playerId,
    currentRoom,
    setScreen,
    setCurrentRoom,
    setRoomId,
  } = useGameStore();

  const handleLeaveRoom = () => {
    socket?.emit('leaveRoom');
    setCurrentRoom(null);
    setRoomId(null);
    setScreen('lobby');
  };

  const handleStartGame = () => {
    socket?.emit('startGame');
  };

  if (!currentRoom) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-xl text-gray-400">방 불러오는 중...</p>
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

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <button type="button" onClick={handleLeaveRoom} className="btn-secondary">
            ← 나가기
          </button>
          <h1 className="text-4xl font-bold text-cyan-400 glow-text">게임 방</h1>
          <div className="w-24" />
        </div>

        <div className="panel-glow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-400 text-sm">방 ID</p>
              <p className="text-lg font-mono text-white">{currentRoom.id.slice(0, 12)}...</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">플레이어</p>
              <p className="text-2xl font-bold text-cyan-400">
                {currentRoom.players.length} / {currentRoom.maxPlayers}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
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
                        <span className="text-xs text-yellow-400">방장</span>
                      )}
                      {player.id === playerId && index !== 0 && (
                        <span className="text-xs text-cyan-400">나</span>
                      )}
                    </>
                  ) : (
                    <div className="py-4">
                      <p className="text-gray-500 text-sm">대기 중...</p>
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
              {canStart ? '게임 시작' : `${GAME_CONFIG.minPlayers - currentRoom.players.length}명 더 필요합니다`}
            </button>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-lg text-cyan-400">방장이 시작하기를 기다리는 중...</span>
              </div>
            </div>
          )}
        </div>

        <div className="panel p-4">
          <p className="text-gray-400 text-sm text-center">
            친구들과 함께 플레이하세요!
          </p>
        </div>
      </div>
    </div>
  );
}
