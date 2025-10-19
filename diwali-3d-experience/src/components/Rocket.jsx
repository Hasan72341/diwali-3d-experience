import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

// Import the GLTF as a URL so Vite serves it correctly
// rocket model served from public/assets
const rocketUrl = "/assets/rocket/scene.gltf";

export default function Rocket({ start, onExplode }) {
  const ref = useRef();
  const lightRef = useRef();
  
  // Preload the rocket model
  useGLTF.preload(rocketUrl);
  const gltf = useGLTF(rocketUrl);

  const [pos] = useState(() => {
    if (start instanceof THREE.Vector3) return start.clone();
    if (Array.isArray(start)) return new THREE.Vector3(...start);
    return new THREE.Vector3(0, 0, 0);
  });
  const [exploded, setExploded] = useState(false);

  // 🎯 Controlled randomness — slight side spread, limited height
  const direction = new THREE.Vector3(
    (Math.random() - 0.5) * 0.6,
    1,
    (Math.random() - 0.5) * 0.6
  ).normalize();

  const speed = 0.25 + Math.random() * 0.1;
  const maxHeight = pos.y + 5.5 + Math.random() * 1; // limited height range (4.5–5.5)

  useFrame(() => {
    if (!ref.current || exploded) return;

    pos.addScaledVector(direction, speed);
    ref.current.position.copy(pos);
    lightRef.current.position.copy(pos);

    if (pos.y >= maxHeight) {
      setExploded(true);
      onExplode(pos.clone());
    }
  });

  if (exploded) return null;

  return (
    <group ref={ref}>
      <primitive object={gltf.scene.clone()} scale={0.2 } rotation={[-Math.PI / 2, Math.PI / 2, Math.PI / 2]} position={[0, -3, 0]} />
      <pointLight ref={lightRef} color="#00ff2aff" intensity={1} distance={6} />
    </group>
  );
}
