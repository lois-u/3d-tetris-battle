import { useMemo } from 'react';
import { BOARD_HEIGHT, Position, Tetromino as TetrominoPiece, TetrominoType, Board } from '@3d-tetris/shared';
import TetrisBoard from './TetrisBoard';
import { TetrominoPreview } from './Tetromino';

interface SoloGameSceneProps {
  board: Board;
  currentPiece: TetrominoPiece | null;
  holdPiece: TetrominoType | null;
  nextPieces: TetrominoType[];
}

export default function SoloGameScene({ board, currentPiece, holdPiece, nextPieces }: SoloGameSceneProps) {
  const ghostPosition = useMemo((): Position | null => {
    if (!currentPiece) return null;
    let ghostY = currentPiece.position.y;
    const shape = currentPiece.shape;
    const pieceX = currentPiece.position.x;

    for (let y = currentPiece.position.y - 1; y >= 0; y--) {
      let canPlace = true;
      for (let i = 0; i < shape.length; i++) {
        const block = shape[i];
        const checkX = pieceX + block.x;
        const checkY = y + block.y;
        if (checkY >= 0 && checkY < BOARD_HEIGHT && board[checkY]?.[checkX] !== null) {
          canPlace = false;
          break;
        }
      }
      if (!canPlace) break;
      ghostY = y;
    }
    return { x: pieceX, y: ghostY };
  }, [currentPiece, board]);

  return (
    <>
      <color attach="background" args={['#0a0a1a']} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 10, 10]} intensity={0.8} />
      <pointLight position={[-8, 5, 5]} intensity={0.3} color="#00f0f0" />
      <pointLight position={[8, 5, 5]} intensity={0.3} color="#a000f0" />

      <group rotation={[0.15, 0, 0]}>
        <group position={[0, 0, 0]}>
          <TetrisBoard
            board={board}
            currentPiece={currentPiece}
            ghostPosition={ghostPosition}
            pendingGarbage={0}
          />
        </group>

        {holdPiece && (
          <group position={[-8, 6, 0]}>
            <TetrominoPreview type={holdPiece} scale={0.7} />
          </group>
        )}

        <group position={[8, 6, 0]}>
          {nextPieces.slice(0, 5).map((type, index) => (
            <group key={index} position={[0, -index * 2.2, 0]}>
              <TetrominoPreview type={type} scale={0.55} />
            </group>
          ))}
        </group>
      </group>
    </>
  );
}
