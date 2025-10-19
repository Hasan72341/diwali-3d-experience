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
