import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/* 🔥 Diya component */
function Diya({ id, position, scale, lit, onToggle }) {
  const flameRef = useRef();
  const lightRef = useRef();

  // small flame flicker animation
  useFrame(({ clock }) => {
    if (lit && flameRef.current && lightRef.current) {
      const t = clock.getElapsedTime();
      const flicker = 1 + Math.sin(t * 12) * 0.1;
      flameRef.current.scale.setScalar(flicker);
      lightRef.current.intensity = 1.4 + Math.sin(t * 10) * 0.3;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Base bowl */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.25, 0.15, 24]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.45} metalness={0.2} />
      </mesh>

      {/* Oil surface */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
        <meshStandardMaterial color="#2a1500" roughness={0.3} />
      </mesh>

      {/* Wick */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.05, 8]} />
        <meshStandardMaterial color="#2a1a0f" />
      </mesh>

      {/* Flame & light */}
      {lit && (
        <>
          <mesh ref={flameRef} position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial emissive="#ffcc33" emissiveIntensity={2} color="#ffaa33" />
          </mesh>
          <pointLight ref={lightRef} position={[0, 0.25, 0]} color="#ffcc66" distance={3} decay={2} />
        </>
      )}

      {/* Clickable invisible area */}
      <mesh
        position={[0, 0.1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(id);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onToggle(id);
        }}
      >
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ✨ Fireflies (simple, no shader) */
function Fireflies({ count = 50, area = 7 }) {
  const ref = useRef();
  const dummy = new THREE.Object3D();

  const fireflies = Array.from({ length: count }, () => ({
    position: [
      (Math.random() - 0.5) * area * 2,
      Math.random() * 2 + 1.5,
      (Math.random() - 0.5) * area * 2,
    ],
    speed: 0.2 + Math.random(),
  }));

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    fireflies.forEach((fly, i) => {
      const [x, y, z] = fly.position;
      dummy.position.set(
        x + Math.sin(t * fly.speed + i) * 0.3,
        y + Math.sin(t * fly.speed * 2) * 0.2,
        z + Math.cos(t * fly.speed + i) * 0.3
      );
      dummy.scale.setScalar(0.1 + Math.sin(t * 5 + i) * 0.03);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#fff6b0" />
    </instancedMesh>
  );
}

/* 🌙 Main Scene */
export default function DiyaGarden() {
  const [isMobile, setIsMobile] = useState(false);
  const [litStates, setLitStates] = useState([]);
  const audioRef = useRef();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const diyasCount = isMobile ? 8 : 10;
  const radius = isMobile ? 1.8 : 3.2;
  const scale = isMobile ? 1.0 : 1.2;

  useEffect(() => {
    setLitStates(Array(diyasCount).fill(false));
  }, [diyasCount]);

  useEffect(() => {
    audioRef.current = new Audio("/diya.mp3");
    audioRef.current.volume = 0.6;
  }, []);

  const onToggle = (id) => {
    setLitStates((prev) => {
      const next = [...prev];
      next[id] = !next[id];
      if (next.every(Boolean)) {
        audioRef.current.play().catch(() => {});
      }
      return next;
    });
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at center, #0a0a0a, #050510 85%)",
      }}
    >
      <Canvas
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={
          isMobile
            ? { position: [0, 2.5, 5], fov: 90 }
            : { position: [0, 4, 7], fov: 45 }
        }
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 5, 3]} intensity={0.6} />
        <OrbitControls enableDamping dampingFactor={0.07} />

        {/* Fireflies */}
        <Fireflies count={isMobile ? 100 : 150} area={radius + 1.2} />

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#111" roughness={1} />
        </mesh>

        {/* Diyas in a circle */}
        {Array.from({ length: diyasCount }).map((_, i) => {
          const angle = (i / diyasCount) * Math.PI * 2;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          return (
            <Diya
              key={i}
              id={i}
              position={[x, 0, z]}
              scale={scale}
              lit={litStates[i]}
              onToggle={onToggle}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
