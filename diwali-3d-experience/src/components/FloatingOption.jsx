import { Text, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

// Import the GLTF as a URL so Vite serves it correctly
import goldenChair from "../assets/golden_india_model/scene.gltf?url";

export default function FloatingOption({ position, color, label, onClick }) {
  const ref = useRef();
  
  // Preload the oil lamp model
  useGLTF.preload(goldenChair);
  const gltf = useGLTF(goldenChair);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.2;
  });

  return (
    <group ref={ref} position={position} onClick={onClick} style={{ cursor: "pointer" }}>
      <directionalLight position={[1, 1, 1]} intensity={2} castShadow />
      <primitive object={gltf.scene.clone()} scale={0.004} />
      <Text position={[-0.2, -1, 0.5]} fontSize={0.3} color="#fff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}
