import { TetrominoType, TETROMINO_COLORS, TETROMINO_SHAPES } from '@3d-tetris/shared';

interface NextQueueProps {
  pieces: TetrominoType[];
}

export default function NextQueue({ pieces }: NextQueueProps) {
  return (
    <div className="panel-glow p-4">
      <div className="text-sm text-gray-400 mb-3 font-bold tracking-wider">NEXT</div>
      <div className="flex flex-col gap-3">
        {pieces.slice(0, 5).map((type, index) => (
          <div
            key={index}
            className={`flex items-center justify-center p-2 rounded ${
              index === 0 ? 'bg-white/10 scale-110' : 'opacity-70'
            }`}
          >
            <MiniTetromino type={type} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniTetromino({ type }: { type: TetrominoType }) {
  const shape = TETROMINO_SHAPES[type][0];
  const color = TETROMINO_COLORS[type];

  const minX = Math.min(...shape.map((b) => b.x));
  const maxX = Math.max(...shape.map((b) => b.x));
  const minY = Math.min(...shape.map((b) => b.y));
  const maxY = Math.max(...shape.map((b) => b.y));

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  return (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${width}, 10px)`,
        gridTemplateRows: `repeat(${height}, 10px)`,
      }}
    >
      {Array.from({ length: height }).map((_, row) =>
        Array.from({ length: width }).map((_, col) => {
          const isBlock = shape.some(
            (b) => b.x - minX === col && maxY - b.y === row
          );
          return (
            <div
              key={`${row}-${col}`}
              className="rounded-sm"
              style={{
                backgroundColor: isBlock ? color : 'transparent',
                boxShadow: isBlock ? `0 0 3px ${color}` : 'none',
              }}
            />
          );
        })
      )}
    </div>
  );
}
