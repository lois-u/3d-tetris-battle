import { useGameStore } from '../../store/gameStore';

export default function SoloGameOver() {
  const { soloFinalScore, setScreen, reset } = useGameStore();

  const handlePlayAgain = () => {
    setScreen('soloGame');
  };

  const handleMainMenu = () => {
    reset();
    setScreen('menu');
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-purple-900/10" />
      </div>

      <div className="relative z-10 text-center panel-glow p-12 max-w-lg">
        <h1 className="text-6xl font-black mb-4 text-cyan-400 glow-text">
          GAME OVER
        </h1>

        <p className="text-2xl text-gray-300 mb-8">
          Solo Mode Complete
        </p>

        <div className="grid grid-cols-3 gap-8 mb-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">SCORE</p>
            <p className="text-3xl font-bold text-white">
              {soloFinalScore?.score.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">LEVEL</p>
            <p className="text-3xl font-bold text-purple-400">
              {soloFinalScore?.level || 1}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-1">LINES</p>
            <p className="text-3xl font-bold text-cyan-400">
              {soloFinalScore?.lines || 0}
            </p>
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
