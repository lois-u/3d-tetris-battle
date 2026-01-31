import { Tetromino as TetrominoType, TETROMINO_SHAPES, TetrominoType as TType } from '@3d-tetris/shared';
import Block from './Block';

interface TetrominoProps {
  piece: TetrominoType;
  isGhost?: boolean;
  offset?: [number, number, number];
}

export default function Tetromino({ piece, isGhost = false, offset = [0, 0, 0] }: TetrominoProps) {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];

  return (
    <group position={offset}>
      {shape.map((block, index) => (
        <Block
          key={index}
          position={[
            piece.position.x + block.x,
            piece.position.y + block.y,
            0,
          ]}
          type={piece.type}
          isGhost={isGhost}
        />
      ))}
    </group>
  );
}

interface TetrominoPreviewProps {
  type: TType;
  position?: [number, number, number];
  scale?: number;
}

export function TetrominoPreview({ type, position = [0, 0, 0], scale = 0.6 }: TetrominoPreviewProps) {
  const shape = TETROMINO_SHAPES[type][0];

  const minX = Math.min(...shape.map((b) => b.x));
  const maxX = Math.max(...shape.map((b) => b.x));
  const minY = Math.min(...shape.map((b) => b.y));
  const maxY = Math.max(...shape.map((b) => b.y));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return (
    <group position={position} scale={scale}>
      {shape.map((block, index) => (
        <Block
          key={index}
          position={[block.x - centerX, block.y - centerY, 0]}
          type={type}
        />
      ))}
    </group>
  );
}
