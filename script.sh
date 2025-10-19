#!/usr/bin/env bash
set -e

APP_NAME="diwali-3d-experience"

echo "🪔 Creating Diwali 3D React + Three.js app..."
npm create vite@latest $APP_NAME -- --template react
cd $APP_NAME

echo "📦 Installing dependencies..."
npm install three @react-three/fiber @react-three/drei react-router-dom @react-three/postprocessing

echo "📁 Creating folders..."
mkdir -p src/{pages,components,assets}

# ========== index.css ==========
cat > src/index.css <<'EOF'
html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: black;
}
canvas {
  display: block;
}
EOF

# ========== main.jsx ==========
cat > src/main.jsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
EOF

# ========== App.jsx ==========
cat > src/App.jsx <<'EOF'
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DiyaGarden from "./pages/DiyaGarden";
import RangoliPainter from "./pages/RangoliPainter";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/diya" element={<DiyaGarden />} />
      <Route path="/rangoli" element={<RangoliPainter />} />
    </Routes>
  );
}
EOF

# ========== components/FloatingOption.js ==========
cat > src/components/FloatingOption.js <<'EOF'
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function FloatingOption({ position, color, label, onClick }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.3;
  });

  return (
    <group ref={ref} position={position} onClick={onClick}>
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={1.5} color={color} />
      </mesh>
      <Text position={[0, 1, 0]} fontSize={0.3} color="#fff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}
EOF

# ========== components/Firework.js ==========
cat > src/components/Firework.js <<'EOF'
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";

export default function Firework({ position }) {
  const count = 120;
  const meshRef = useRef();
  const velocities = useRef([]);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vels = [];
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      pos.set([dir.x, dir.y, dir.z], i * 3);
      vels.push(dir.multiplyScalar(Math.random() * 0.08 + 0.02));
    }
    velocities.current = vels;
    return pos;
  }, []);

  useFrame((_, delta) => {
    const geom = meshRef.current.geometry;
    const arr = geom.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const v = velocities.current[i];
      const j = i * 3;
      arr[j] += v.x;
      arr[j + 1] += v.y;
      arr[j + 2] += v.z;
      v.y -= delta * 0.05; // gravity
    }
    geom.attributes.position.needsUpdate = true;
    meshRef.current.material.opacity -= delta * 0.5;
  });

  return (
    <points ref={meshRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#ffcc66" transparent opacity={1} />
    </points>
  );
}
EOF

# ========== pages/LandingPage.jsx ==========
cat > src/pages/LandingPage.jsx <<'EOF'
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Stars } from "@react-three/drei";
import { Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import Firework from "../components/Firework";
import FloatingOption from "../components/FloatingOption";

export default function LandingPage() {
  const [fireworks, setFireworks] = useState([]);
  const navigate = useNavigate();

  const handleBackgroundClick = () => {
    const x = (Math.random() - 0.5) * 10;
    const y = Math.random() * 4 + 2;
    const z = (Math.random() - 0.5) * 10;
    setFireworks((prev) => [...prev, { id: Date.now(), position: [x, y, z] }]);
    const audio = new Audio("/crackle.mp3");
    audio.volume = 0.3;
    audio.play();
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }} onClick={handleBackgroundClick}>
        <color attach="background" args={["#030008"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={0.7} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.4} />
        <Stars radius={50} count={5000} factor={2} fade />

        <Suspense fallback={null}>
          <Text position={[0, 3, 0]} fontSize={1} color="#ffcc33" fontWeight="bold">
            🪔 Happy Diwali
          </Text>

          <FloatingOption
            label="🪔 Diya Garden"
            color="#ff9933"
            position={[-2, 0, 0]}
            onClick={() => navigate("/diya")}
          />
          <FloatingOption
            label="🎨 Rangoli Painter"
            color="#ff66aa"
            position={[2, 0, 0]}
            onClick={() => navigate("/rangoli")}
          />
        </Suspense>

        {fireworks.map((fw) => (
          <Firework key={fw.id} position={fw.position} />
        ))}
      </Canvas>
      <p style={{
        position: "absolute",
        bottom: "10px",
        width: "100%",
        textAlign: "center",
        color: "#aaa",
        fontSize: "14px"
      }}>
        Click anywhere to celebrate 🎆
      </p>
    </div>
  );
}
EOF

# ========== pages/DiyaGarden.jsx ==========
cat > src/pages/DiyaGarden.jsx <<'EOF'
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";

function Diya() {
  const lightRef = useRef();
  const flameRef = useRef();
  const [lit, setLit] = useState(false);

  useFrame((state) => {
    if (lit && flameRef.current && lightRef.current) {
      const t = state.clock.elapsedTime;
      flameRef.current.scale.setScalar(1 + Math.sin(t * 10) * 0.08);
      lightRef.current.intensity = 1.2 + Math.sin(t * 12) * 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]} onClick={() => setLit(!lit)} scale={1.5}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 1, 0.4, 32, 1, true]} />
        <meshStandardMaterial color="#82431b" side={2} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
        <meshStandardMaterial color="#2b1a10" />
      </mesh>
      {lit && (
        <>
          <mesh ref={flameRef} position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial emissive="#ffcc33" emissiveIntensity={2} />
          </mesh>
          <pointLight ref={lightRef} position={[0, 0.4, 0]} color="#ffdd88" />
        </>
      )}
    </group>
  );
}

export default function DiyaGarden() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 4, 7], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <OrbitControls enableDamping />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {[...Array(8)].map((_, i) => (
        <Diya
          key={i}
          position={[
            Math.sin((i / 8) * Math.PI * 2) * 3,
            0,
            Math.cos((i / 8) * Math.PI * 2) * 3,
          ]}
        />
      ))}
    </Canvas>
  );
}
EOF

# ========== pages/RangoliPainter.jsx ==========
cat > src/pages/RangoliPainter.jsx <<'EOF'
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState } from "react";

function Petal({ position, rotation }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <coneGeometry args={[0.15, 0.3, 16]} />
      <meshStandardMaterial color="#ff66aa" emissive="#ff99cc" />
    </mesh>
  );
}

function RangoliCanvas() {
  const [petals, setPetals] = useState([]);
  const symmetry = 6;

  function onClick(e) {
    e.stopPropagation();
    const p = e.point;
    const newPetals = [];
    for (let i = 0; i < symmetry; i++) {
      const angle = (i / symmetry) * Math.PI * 2;
      const x = Math.cos(angle) * p.x - Math.sin(angle) * p.z;
      const z = Math.sin(angle) * p.x + Math.cos(angle) * p.z;
      newPetals.push({ position: [x, 0.05, z], rotation: angle });
    }
    setPetals((prev) => [...prev, ...newPetals]);
  }

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={onClick}>
        <circleGeometry args={[4, 64]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {petals.map((p, i) => (
        <Petal key={i} position={p.position} rotation={p.rotation} />
      ))}
    </>
  );
}

export default function RangoliPainter() {
  return (
    <Canvas style={{ width: "100vw", height: "100vh" }} camera={{ position: [0, 5, 6], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <OrbitControls enableRotate enablePan={false} />
      <RangoliCanvas />
    </Canvas>
  );
}
EOF

# 🔊 Download Firework Sound
echo "🔊 Downloading crackle sound..."
curl -L -o public/crackle.mp3 "https://cdn.pixabay.com/download/audio/2022/03/10/audio_4b8d197b3c.mp3?filename=firework-crackle-138481.mp3" > /dev/null 2>&1 || echo "⚠️ Could not auto-download sound. Place crackle.mp3 in /public/ manually."

echo "✅ Setup complete!"
echo "🚀 Starting development server..."
npm run dev
