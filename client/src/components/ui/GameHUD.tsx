import { useGameStore } from '../../store/gameStore';
import HoldPiece from './HoldPiece';
import NextQueue from './NextQueue';
import ScoreBoard from './ScoreBoard';

export default function GameHUD() {
  const { getMyState, getOpponentStates, gameState } = useGameStore();

  const myState = getMyState();
  const opponentStates = getOpponentStates();

  if (!myState) return null;

  return (
    <>
      <div className="absolute top-4 left-4 flex flex-col gap-4">
        <HoldPiece piece={myState.holdPiece} canHold={myState.canHold} />
        <ScoreBoard
          score={myState.score}
          level={myState.level}
          lines={myState.linesCleared}
          combo={myState.combo}
          backToBack={myState.backToBack}
        />
      </div>

      <div className="absolute top-4 right-4">
        <NextQueue pieces={myState.nextPieces} />
      </div>

      {opponentStates.length > 0 && (
        <div className="absolute bottom-4 right-4 panel-glow p-4 max-h-64 overflow-y-auto">
          <div className="text-sm text-gray-400 mb-2">상대 ({opponentStates.length})</div>
          <div className="space-y-2">
            {opponentStates.slice(0, 4).map((opponent) => (
              <div
                key={opponent.id}
                className={`text-sm ${opponent.isAlive ? '' : 'opacity-50'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      opponent.isAlive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-bold text-white">{opponent.name}</span>
                </div>
                <div className="text-xs text-cyan-400 ml-4">
                  {opponent.score.toLocaleString()}점 • Lv.{opponent.level}
                </div>
              </div>
            ))}
            {opponentStates.length > 4 && (
              <div className="text-xs text-gray-500">
                +{opponentStates.length - 4}명 더...
              </div>
            )}
          </div>
        </div>
      )}

      {myState.pendingGarbage > 0 && (
        <div className="absolute left-1/2 top-4 transform -translate-x-1/2">
          <div className="bg-red-600/80 px-4 py-2 rounded-lg">
            <span className="text-white font-bold">
              {myState.pendingGarbage} 라인 수신 중
            </span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-xs text-gray-500">
        <div>← → 이동 | ↑ 회전 | Space 하드 드롭</div>
        <div>Z/Ctrl 반시계 | C/Shift 홀드 | ↓ 소프트 드롭</div>
      </div>
    </>
  );
}
