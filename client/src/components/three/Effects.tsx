import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, AdditiveBlending } from 'three';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINO_COLORS, TetrominoType } from '@3d-tetris/shared';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
}

interface LineClearEffectProps {
  clearedLines: number[];
  onComplete: () => void;
}

export function LineClearEffect({ clearedLines, onComplete }: LineClearEffectProps) {
  const pointsRef = useRef<Points>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  const offsetX = -BOARD_WIDTH / 2;
  const offsetY = -BOARD_HEIGHT / 2;

  useEffect(() => {
    const particles: Particle[] = [];
    const colors = Object.values(TETROMINO_COLORS);

    for (const lineY of clearedLines) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: x + offsetX + 0.5 + (Math.random() - 0.5) * 0.5,
            y: lineY + offsetY + 0.5 + (Math.random() - 0.5) * 0.5,
            z: (Math.random() - 0.5) * 2,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 + 2,
            vz: (Math.random() - 0.5) * 3,
            life: 1,
            maxLife: 0.8 + Math.random() * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    }

    particlesRef.current = particles;
    timeRef.current = 0;

    const timeout = setTimeout(onComplete, 800);
    return () => clearTimeout(timeout);
  }, [clearedLines, offsetX, offsetY, onComplete]);

  useFrame((_, delta) => {
    timeRef.current += delta;

    const particles = particlesRef.current;
    if (particles.length === 0 || !pointsRef.current) return;

    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= 10 * delta;
      p.life -= delta / p.maxLife;

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      const hex = parseInt(p.color.slice(1), 16);
      const r = ((hex >> 16) & 255) / 255;
      const g = ((hex >> 8) & 255) / 255;
      const b = (hex & 255) / 255;
      const alpha = Math.max(0, p.life);

      colors[i * 3] = r * alpha;
      colors[i * 3 + 1] = g * alpha;
      colors[i * 3 + 2] = b * alpha;
    }

    const geometry = pointsRef.current.geometry as BufferGeometry;
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

interface LockFlashEffectProps {
  position: [number, number, number];
  color: string;
  onComplete: () => void;
}

export function LockFlashEffect({ position, color, onComplete }: LockFlashEffectProps) {
  const meshRef = useRef<any>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(onComplete, 200);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const progress = timeRef.current / 0.2;
      meshRef.current.scale.setScalar(1 + progress * 2);
      meshRef.current.material.opacity = Math.max(0, 1 - progress);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry args={[0.3, 0.5, 16]} />
      <meshBasicMaterial color={color} transparent opacity={1} />
    </mesh>
  );
}

interface ComboTextEffectProps {
  combo: number;
  position: [number, number, number];
}

export function ComboTextEffect({ combo, position }: ComboTextEffectProps) {
  const groupRef = useRef<any>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + timeRef.current * 2;
      const scale = 1 + Math.sin(timeRef.current * 10) * 0.1;
      groupRef.current.scale.setScalar(scale);
    }
  });

  if (combo < 2) return null;

  return (
    <group ref={groupRef} position={position}>
      <sprite scale={[2, 1, 1]}>
        <spriteMaterial color="#ffff00" transparent opacity={Math.max(0, 1 - timeRef.current)} />
      </sprite>
    </group>
  );
}

interface GarbageWarningEffectProps {
  amount: number;
}

export function GarbageWarningEffect({ amount }: GarbageWarningEffectProps) {
  const meshRef = useRef<any>(null);

  useFrame((state) => {
    if (meshRef.current && amount > 0) {
      meshRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
    }
  });

  if (amount === 0) return null;

  const offsetX = -BOARD_WIDTH / 2;
  const offsetY = -BOARD_HEIGHT / 2;

  return (
    <mesh ref={meshRef} position={[offsetX - 1, offsetY + amount / 2, 0.5]}>
      <boxGeometry args={[0.5, amount, 0.5]} />
      <meshStandardMaterial
        color="#ff0000"
        emissive="#ff0000"
        emissiveIntensity={0.8}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}
