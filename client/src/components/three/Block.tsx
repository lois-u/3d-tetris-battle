import { useRef, useMemo } from 'react';
import { Mesh, BoxGeometry } from 'three';
import { TetrominoType, TETROMINO_COLORS, TETROMINO_EMISSIVE_COLORS } from '@3d-tetris/shared';

interface BlockProps {
  position: [number, number, number];
  type: TetrominoType;
  isGhost?: boolean;
  scale?: number;
}

export default function Block({ position, type, isGhost = false, scale = 1 }: BlockProps) {
  const meshRef = useRef<Mesh>(null);
  const color = TETROMINO_COLORS[type];
  const emissive = TETROMINO_EMISSIVE_COLORS[type];

  const edgeGeometry = useMemo(() => new BoxGeometry(0.95, 0.95, 0.95), []);

  return (
    <group position={position} scale={scale}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isGhost ? 0.1 : 0.3}
          transparent={isGhost}
          opacity={isGhost ? 0.3 : 1}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {!isGhost && (
        <lineSegments>
          <edgesGeometry args={[edgeGeometry]} />
          <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </lineSegments>
      )}
    </group>
  );
}
