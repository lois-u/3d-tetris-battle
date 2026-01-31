interface ScoreBoardProps {
  score: number;
  level: number;
  lines: number;
  combo: number;
  backToBack: boolean;
}

export default function ScoreBoard({ score, level, lines, combo, backToBack }: ScoreBoardProps) {
  return (
    <div className="panel-glow p-4 space-y-3">
      <div>
        <div className="text-xs text-gray-400">점수</div>
        <div className="text-2xl font-bold text-white tabular-nums">
          {score.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400">레벨</div>
          <div className="text-xl font-bold text-purple-400">{level}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">라인</div>
          <div className="text-xl font-bold text-cyan-400">{lines}</div>
        </div>
      </div>

      {combo > 0 && (
        <div className="bg-yellow-500/20 rounded px-2 py-1 text-center">
          <span className="text-yellow-400 font-bold">콤보 x{combo}</span>
        </div>
      )}

      {backToBack && (
        <div className="bg-purple-500/20 rounded px-2 py-1 text-center">
          <span className="text-purple-400 font-bold text-sm">백투백</span>
        </div>
      )}
    </div>
  );
}
