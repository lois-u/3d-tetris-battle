import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const outlineRef = useRef<THREE.LineSegments>(null);
  const color = TETROMINO_COLORS[type];
  const emissive = TETROMINO_EMISSIVE_COLORS[type];

  const edgeGeometry = useMemo(() => new BoxGeometry(0.95, 0.95, 0.95), []);

  useFrame((state) => {
    if (isGhost && meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    }
    if (isGhost && outlineRef.current) {
      const material = outlineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshStandardMaterial
          color={isGhost ? '#ffffff' : color}
          emissive={emissive}
          emissiveIntensity={isGhost ? 0.3 : 0.3}
          transparent={isGhost}
          opacity={isGhost ? 0.45 : 1}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {isGhost && (
        <lineSegments ref={outlineRef}>
          <edgesGeometry args={[edgeGeometry]} />
          <lineBasicMaterial color={color} transparent opacity={0.8} linewidth={2} />
        </lineSegments>
      )}
      {!isGhost && (
        <lineSegments>
          <edgesGeometry args={[edgeGeometry]} />
          <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </lineSegments>
      )}
    </group>
  );
}
