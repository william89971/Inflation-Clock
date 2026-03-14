"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface CoinProps {
  spinSpeed: number;
}

function createFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Radial gold gradient background
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, "#ffb300");
  gradient.addColorStop(0.5, "#f7931a");
  gradient.addColorStop(1, "#c8600a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // ₿ symbol centered
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 240px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("₿", 256, 256);

  return new THREE.CanvasTexture(canvas);
}

function createGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,150,0,0.6)");
  gradient.addColorStop(0.4, "rgba(255,100,0,0.3)");
  gradient.addColorStop(1, "rgba(255,100,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  return new THREE.CanvasTexture(canvas);
}

function Coin({ spinSpeed }: CoinProps) {
  const coinRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const faceTexture = useMemo(() => createFaceTexture(), []);
  const glowTexture = useMemo(() => createGlowTexture(), []);

  // Materials for cylinder: [side, top cap, bottom cap]
  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: "#f7931a", metalness: 0.95, roughness: 0.08 }),
    new THREE.MeshStandardMaterial({ map: faceTexture, metalness: 0.9, roughness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: faceTexture, metalness: 0.9, roughness: 0.1 }),
  ], [faceTexture]);

  const torusMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffd700", metalness: 1.0, roughness: 0.05 }),
    []
  );

  const glowMaterial = useMemo(
    () => new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, transparent: true }),
    [glowTexture]
  );

  // Particles
  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(120 * 3);
    const colors = new Float32Array(120 * 3);

    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2;
      const radius = 2.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Orange to gold gradient
      const t = i / 120;
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.45 + t * 0.4;
      colors[i * 3 + 2] = 0.0 + t * 0.05;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.01 * spinSpeed;
      coinRef.current.position.y = Math.sin(t * 0.8) * 0.12;
      coinRef.current.rotation.z = Math.sin(t * 0.5) * 0.05;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.004 * spinSpeed;
    }
  });

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.3} />
      <pointLight color="#ff8c00" intensity={3} position={[3, 3, 3]} />
      <pointLight color="#ffd700" intensity={2} position={[-3, -2, 2]} />
      <pointLight color="#ff6600" intensity={1.5} position={[0, 0, -5]} />

      {/* Coin group */}
      <group ref={coinRef}>
        {/* Main cylinder */}
        <mesh material={materials}>
          <cylinderGeometry args={[1.5, 1.5, 0.18, 64]} />
        </mesh>

        {/* Top torus ring */}
        <mesh material={torusMaterial} position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.04, 16, 64]} />
        </mesh>

        {/* Bottom torus ring */}
        <mesh material={torusMaterial} position={[0, -0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.04, 16, 64]} />
        </mesh>

        {/* Glow sprite */}
        <sprite material={glowMaterial} scale={[6, 6, 1]} />
      </group>

      {/* Orbiting particles */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />
    </>
  );
}

interface BitcoinCoinProps {
  spinSpeed?: number;
}

export default function BitcoinCoin({ spinSpeed = 1.2 }: BitcoinCoinProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 1.5, 5], fov: 50 }}
      style={{ background: "transparent" }}
    >
      <Coin spinSpeed={spinSpeed} />
      <OrbitControls enableDamping dampingFactor={0.05} enableZoom={false} enablePan={false} />
    </Canvas>
  );
}
