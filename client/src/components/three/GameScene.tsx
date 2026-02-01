import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import TetrisBoard from './TetrisBoard';
import { TetrominoPreview } from './Tetromino';
import { BOARD_HEIGHT, Position, PlayerState } from '@3d-tetris/shared';

function getOpponentPositions(count: number): { x: number; z: number; scale: number }[] {
  if (count === 0) return [];
  
  if (count === 1) {
    return [{ x: 14, z: 0, scale: 0.5 }];
  }
  
  if (count <= 3) {
    const positions = [
      { x: 14, z: 2, scale: 0.45 },
      { x: 14, z: -6, scale: 0.45 },
      { x: -14, z: -2, scale: 0.45 },
    ];
    return positions.slice(0, count);
  }
  
  if (count <= 5) {
    const positions = [
      { x: 12, z: 4, scale: 0.38 },
      { x: 12, z: -4, scale: 0.38 },
      { x: -12, z: 4, scale: 0.38 },
      { x: -12, z: -4, scale: 0.38 },
      { x: 18, z: 0, scale: 0.38 },
    ];
    return positions.slice(0, count);
  }
  
  const positions = [
    { x: 12, z: 5, scale: 0.32 },
    { x: 12, z: -3, scale: 0.32 },
    { x: -12, z: 5, scale: 0.32 },
    { x: -12, z: -3, scale: 0.32 },
    { x: 18, z: 3, scale: 0.32 },
    { x: 18, z: -5, scale: 0.32 },
    { x: -18, z: 1, scale: 0.32 },
  ];
  return positions.slice(0, count);
}

interface OpponentBoardProps {
  opponent: PlayerState;
  position: { x: number; z: number; scale: number };
}

function OpponentBoard({ opponent, position }: OpponentBoardProps) {
  return (
    <group position={[position.x, 0, position.z]} scale={position.scale}>
      <TetrisBoard
        board={opponent.board}
        currentPiece={opponent.currentPiece}
        ghostPosition={null}
        pendingGarbage={opponent.pendingGarbage}
        isOpponent
      />
      <mesh position={[5, 22, 0]}>
        <planeGeometry args={[12, 2]} />
        <meshBasicMaterial color={opponent.isAlive ? '#1a1a2e' : '#3a1a1a'} transparent opacity={0.8} />
      </mesh>
      <Text
        position={[5, -2, 0]}
        fontSize={1.5}
        color={opponent.isAlive ? '#ffffff' : '#ff4444'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {opponent.name}
      </Text>
    </group>
  );
}

export default function GameScene() {
  const { getMyState, getOpponentStates } = useGameStore();

  const myState = getMyState();
  const opponentStates = getOpponentStates();

  const ghostPosition = useMemo((): Position | null => {
    if (!myState?.currentPiece) return null;
    let ghostY = myState.currentPiece.position.y;
    const shape = myState.currentPiece.shape;
    const pieceX = myState.currentPiece.position.x;

    for (let y = myState.currentPiece.position.y - 1; y >= 0; y--) {
      let canPlace = true;
      for (let i = 0; i < shape.length; i++) {
        const block = shape[i];
        const checkX = pieceX + block.x;
        const checkY = y + block.y;
        if (checkY >= 0 && checkY < BOARD_HEIGHT && myState.board[checkY]?.[checkX] !== null) {
          canPlace = false;
          break;
        }
      }
      if (!canPlace) break;
      ghostY = y;
    }
    return { x: pieceX, y: ghostY };
  }, [myState?.currentPiece, myState?.board]);

  const opponentPositions = useMemo(
    () => getOpponentPositions(opponentStates.length),
    [opponentStates.length]
  );

  if (!myState) return null;

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
            board={myState.board}
            currentPiece={myState.currentPiece}
            ghostPosition={ghostPosition}
            pendingGarbage={myState.pendingGarbage}
          />
        </group>

        {opponentStates.map((opponent, index) => (
          <OpponentBoard
            key={opponent.id}
            opponent={opponent}
            position={opponentPositions[index]}
          />
        ))}

        {myState.holdPiece && (
          <group position={[-8, 6, 0]}>
            <TetrominoPreview type={myState.holdPiece} scale={0.7} />
          </group>
        )}

        <group position={[8, 6, 0]}>
          {myState.nextPieces.slice(0, 5).map((type, index) => (
            <group key={index} position={[0, -index * 2.2, 0]}>
              <TetrominoPreview type={type} scale={0.55} />
            </group>
          ))}
        </group>
      </group>
    </>
  );
}
