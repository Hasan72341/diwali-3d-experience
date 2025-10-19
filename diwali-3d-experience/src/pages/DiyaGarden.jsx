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
      <primitive object={gltf.scene.clone()} scale={0.1} position={[0, 0, 0]} />
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
