import { TetrominoType, TETROMINO_COLORS, TETROMINO_SHAPES } from '@3d-tetris/shared';

interface HoldPieceProps {
  piece: TetrominoType | null;
  canHold: boolean;
}

export default function HoldPiece({ piece, canHold }: HoldPieceProps) {
  return (
    <div className={`panel-glow p-4 ${!canHold ? 'opacity-50' : ''}`}>
      <div className="text-sm text-gray-400 mb-2 font-bold tracking-wider">홀드</div>
      <div className="w-20 h-16 flex items-center justify-center">
        {piece ? (
          <MiniTetromino type={piece} />
        ) : (
          <div className="w-12 h-12 border border-dashed border-gray-600 rounded" />
        )}
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
        gridTemplateColumns: `repeat(${width}, 12px)`,
        gridTemplateRows: `repeat(${height}, 12px)`,
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
                boxShadow: isBlock ? `0 0 4px ${color}` : 'none',
              }}
            />
          );
        })
      )}
    </div>
  );
}
