import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function MainMenu() {
  const { socket, setScreen, setPlayerName, playerName } = useGameStore();
  const [name, setName] = useState(playerName || '');
  const [error, setError] = useState('');

  const handlePlay = () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (name.trim().length < 2) {
      setError('이름은 최소 2자 이상이어야 합니다');
      return;
    }

    setPlayerName(name.trim());
    socket?.emit('joinLobby', { playerName: name.trim() });
    setScreen('lobby');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-7xl font-black mb-2 tetris-gradient bg-clip-text text-transparent">
          3D Tetris
        </h1>
        <h2 className="text-3xl font-bold text-cyan-400 glow-text mb-12 tracking-widest">
          Battle
        </h2>

        <div className="panel-glow max-w-md mx-auto p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
              플레이어 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
              placeholder="이름을 입력하세요..."
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                       focus:ring-2 focus:ring-cyan-400/20 transition-all"
              maxLength={20}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <button onClick={handlePlay} className="btn-primary w-full">
            온라인 플레이
          </button>

          <div className="mt-6 text-sm text-gray-400">
            <p>조작법:</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <span>← → / A D</span><span>이동</span>
              <span>↑ / X</span><span>시계방향 회전</span>
              <span>Z / Ctrl</span><span>반시계방향 회전</span>
              <span>↓ / S</span><span>소프트 드롭</span>
              <span>Space</span><span>하드 드롭</span>
              <span>C / Shift</span><span>홀드</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-gray-500 text-sm">
          실시간으로 다른 플레이어와 대전하세요!
        </p>
      </div>
    </div>
  );
}
