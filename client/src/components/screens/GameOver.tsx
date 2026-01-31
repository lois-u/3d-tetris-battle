import { useGameStore } from '../../store/gameStore';

export default function GameOver() {
  const { winner, playerName, gameState, reset, setScreen, socket } = useGameStore();

  const myState = gameState?.players.find((p) => p.name === playerName);
  const opponentStates = gameState?.players.filter((p) => p.name !== playerName) || [];
  const isWinner = winner === playerName;
  const totalPlayers = gameState?.players.length || 2;

  const handlePlayAgain = () => {
    reset();
    socket?.emit('joinLobby', { playerName });
    setScreen('lobby');
  };

  const handleMainMenu = () => {
    reset();
    setScreen('menu');
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isWinner ? (
          <>
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          </>
        ) : (
          <div className="absolute inset-0 bg-red-900/10" />
        )}
      </div>

      <div className="relative z-10 text-center panel-glow p-12 max-w-lg">
        <h1
          className={`text-6xl font-black mb-4 ${
            isWinner ? 'text-yellow-400 glow-text' : 'text-red-400'
          }`}
        >
          {isWinner ? 'VICTORY!' : 'DEFEAT'}
        </h1>

        <p className="text-2xl text-gray-300 mb-8">
          {isWinner
            ? totalPlayers > 2
              ? `You defeated ${totalPlayers - 1} opponents!`
              : `You defeated ${opponentStates[0]?.name || 'opponent'}!`
            : totalPlayers > 2
            ? `${winner} wins!`
            : `You lost to ${winner}!`}
        </p>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Your Score</p>
            <p className="text-3xl font-bold text-white">{myState?.score?.toLocaleString() || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">Players</p>
            <p className="text-3xl font-bold text-gray-400">{totalPlayers}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div>
            <p className="text-gray-400 text-xs">Lines</p>
            <p className="text-xl font-bold text-cyan-400">{myState?.linesCleared || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Level</p>
            <p className="text-xl font-bold text-purple-400">{myState?.level || 1}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Max Combo</p>
            <p className="text-xl font-bold text-yellow-400">{myState?.combo || 0}</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button type="button" onClick={handlePlayAgain} className="btn-primary">
            PLAY AGAIN
          </button>
          <button type="button" onClick={handleMainMenu} className="btn-secondary">
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
