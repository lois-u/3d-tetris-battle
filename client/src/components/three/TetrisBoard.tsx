import { useMemo } from 'react';
import { BoxGeometry } from 'three';
import { Board, BOARD_WIDTH, BOARD_HEIGHT, Tetromino as TetrominoPiece, Position } from '@3d-tetris/shared';
import Block from './Block';
import Tetromino from './Tetromino';

interface TetrisBoardProps {
  board: Board;
  currentPiece: TetrominoPiece | null;
  ghostPosition: Position | null;
  pendingGarbage: number;
  isOpponent?: boolean;
}

export default function TetrisBoard({
  board,
  currentPiece,
  ghostPosition,
  pendingGarbage,
  isOpponent = false,
}: TetrisBoardProps) {
  const scale = isOpponent ? 0.4 : 1;
  const offsetX = -BOARD_WIDTH / 2;
  const offsetY = -BOARD_HEIGHT / 2;

  const boardGeometry = useMemo(() => new BoxGeometry(BOARD_WIDTH, BOARD_HEIGHT, 0.1), []);

  const boardBlocks = useMemo(() => {
    const blocks: JSX.Element[] = [];

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = board[y]?.[x];
        if (cell) {
          blocks.push(
            <Block
              key={`${x}-${y}`}
              position={[x + offsetX + 0.5, y + offsetY + 0.5, 0]}
              type={cell}
            />
          );
        }
      }
    }

    return blocks;
  }, [board, offsetX, offsetY]);

  return (
    <group scale={scale}>
      <mesh position={[0, 0, -0.6]}>
        <boxGeometry args={[BOARD_WIDTH + 0.2, BOARD_HEIGHT + 0.2, 0.1]} />
        <meshStandardMaterial color="#0a0a1a" transparent opacity={0.9} />
      </mesh>

      <lineSegments position={[0, 0, -0.55]}>
        <edgesGeometry args={[boardGeometry]} />
        <lineBasicMaterial color="#00f0f0" transparent opacity={0.5} />
      </lineSegments>

      {boardBlocks}

      {currentPiece && ghostPosition && !isOpponent && (
        <Tetromino
          piece={{ ...currentPiece, position: ghostPosition }}
          isGhost
          offset={[offsetX + 0.5, offsetY + 0.5, 0]}
        />
      )}

      {currentPiece && (
        <Tetromino
          piece={currentPiece}
          offset={[offsetX + 0.5, offsetY + 0.5, 0]}
        />
      )}

      {pendingGarbage > 0 && (
        <mesh position={[offsetX - 0.8, offsetY + pendingGarbage / 2, 0]}>
          <boxGeometry args={[0.3, pendingGarbage, 0.5]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      )}

      <mesh position={[0, offsetY - 0.6, 0]}>
        <boxGeometry args={[BOARD_WIDTH + 2, 0.2, 1]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[offsetX - 0.6, 0, 0]}>
        <boxGeometry args={[0.2, BOARD_HEIGHT + 1.2, 1]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-offsetX + 0.6, 0, 0]}>
        <boxGeometry args={[0.2, BOARD_HEIGHT + 1.2, 1]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
