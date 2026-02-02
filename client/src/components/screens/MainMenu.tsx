import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function MainMenu() {
  const { socket, setScreen, setPlayerName, playerName } = useGameStore();
  const [name, setName] = useState(playerName || '');
  const [error, setError] = useState('');

  const handlePlay = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setPlayerName(name.trim());
    socket?.emit('joinLobby', { playerName: name.trim() });
    setScreen('lobby');
  };

  const handleSoloPlay = () => {
    setPlayerName(name.trim() || 'Player');
    setScreen('soloGame');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-7xl font-black mb-2 tetris-gradient">
          3D Tetris
        </h1>
        <h2 className="text-3xl font-bold text-cyan-400 glow-text mb-12 tracking-widest">
          Battle
        </h2>

        <div className="panel-glow max-w-md mx-auto p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
              PLAYER NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                       focus:ring-2 focus:ring-cyan-400/20 transition-all"
              maxLength={20}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <button type="button" onClick={handlePlay} className="btn-primary w-full">
            PLAY ONLINE
          </button>

          <button type="button" onClick={handleSoloPlay} className="btn-secondary w-full mt-3">
            SOLO PLAY
          </button>

          <div className="mt-6 text-sm text-gray-400">
            <p>Controls:</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <span>← → / A D</span><span>Move</span>
              <span>↑ / X</span><span>Rotate CW</span>
              <span>Z / Ctrl</span><span>Rotate CCW</span>
              <span>↓ / S</span><span>Soft Drop</span>
              <span>Space</span><span>Hard Drop</span>
              <span>C / Shift</span><span>Hold</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-gray-500 text-sm">
          Battle against other players in real-time!
        </p>
      </div>
    </div>
  );
}
