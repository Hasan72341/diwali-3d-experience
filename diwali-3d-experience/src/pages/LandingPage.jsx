import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Trail,
  Text3D,
  Center,
  useProgress,
} from "@react-three/drei";
import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import Firework from "../components/Firework";
import FloatingOption from "../components/FloatingOption";
import Loader from "../components/Loader";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/* 🪔 Assets */
const lakshmiUrl = "/assets/lakshmi_3d_model/scene.gltf";
const jumpPadUrl = "/assets/sm_jumppad/scene.gltf";
useGLTF.preload(lakshmiUrl);
useGLTF.preload(jumpPadUrl);

const crackleAudio = new Audio("/crackle.mp3");
crackleAudio.volume = 0.4;

/* 🌠 Glowing Stars — now react to nearby fireworks */
function GlowingStars({ count = 2500, flashAnim }) {
  const starsRef = useRef();
  const materialRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const r = 300 * Math.cbrt(Math.random()); // spread out
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i] = r * Math.sin(phi) * Math.cos(theta);
      pos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  const vertexShader = `
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = 6.6 * (250.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      float alpha = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(uColor, alpha * uOpacity);
    }
  `;

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#ffeebc") },
      uOpacity: { value: 0.9 },
    }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    let flicker = 0.8 + 0.15 * Math.sin(t * 2.0);

    // 🔆 If a flash is active (firework explosion)
    if (flashAnim.active) {
      const elapsed = t - flashAnim.startTime;
      const fade = Math.sin(Math.min(elapsed / 1.0, 1.0) * Math.PI); // 1 sec flash
      flicker += fade * 1.2; // temporary brightness bump
      // subtle color shift from firework color
      uniforms.uColor.value.lerp(new THREE.Color(flashAnim.color), 0.15);
    } else {
      // slowly restore default color
      uniforms.uColor.value.lerp(new THREE.Color("#ffeebc"), 0.02);
    }

    uniforms.uOpacity.value = flicker;
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* 💫 Ambient flash + Lakshmi shimmer */
function AmbientFlashController({ ambientRef, flashAnim, lakshmiRef }) {
  useFrame(({ clock }) => {
    if (!ambientRef.current || !flashAnim.active) return;
    const elapsed = clock.getElapsedTime() - flashAnim.startTime;
    const duration = 6.0;
    const t = Math.min(elapsed / duration, 1);
    const flashFactor = Math.sin(t * Math.PI);
    const intensity = THREE.MathUtils.lerp(0.5, 2.5, flashFactor);

    ambientRef.current.intensity = intensity;
    ambientRef.current.color.lerp(new THREE.Color(flashAnim.color), 0.1);

    if (lakshmiRef.current) {
      lakshmiRef.current.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissiveIntensity = 0.05 + flashFactor * 0.4;
        }
      });
    }

    if (elapsed >= duration) flashAnim.active = false;
  });
  return null;
}

/* 🧱 LaunchPad */
function LaunchPad({ position, onClick }) {
  const gltf = useGLTF(jumpPadUrl);
  const adjustedPos = [position[0], position[1] - 7, position[2]];
  return (
    <group
      position={adjustedPos}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick(adjustedPos);
      }}
    >
      <primitive object={gltf.scene.clone()} scale={2.0} />
    </group>
  );
}

/* 🚀 TrailRocket */
function TrailRocket({ start, onExplode }) {
  const pos = useRef(start.clone ? start.clone() : new THREE.Vector3(...start));
  const rocketRef = useRef();
  const rocketLight = useRef();

  const velocity = useRef(
    new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      1.0,
      (Math.random() - 0.5) * 0.1
    )
      .normalize()
      .multiplyScalar(0.4)
  );

  const [exploded, setExploded] = useState(false);
  const maxHeight = pos.current.y + 14 + Math.random() * 1.2;
  const trailKey = useMemo(() => crypto.randomUUID(), []);

  useFrame((_, delta) => {
    if (exploded) return;
    pos.current.addScaledVector(velocity.current, delta * 30);
    rocketRef.current?.position.copy(pos.current);
    rocketLight.current?.position.copy(pos.current);

    if (pos.current.y >= maxHeight) {
      setExploded(true);
      onExplode(pos.current.clone());
    }
  });

  if (exploded) return null;
  return (
    <>
      <Trail
        key={trailKey}
        width={1.8}
        color="#ffdd55"
        length={2.5}
        decay={2.5}
        local={false}
        attenuation={(t) => 1 - t}
      >
        <mesh ref={rocketRef} position={pos.current}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#ffaa33"
            emissive="#ff6600"
            emissiveIntensity={1.4}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      </Trail>
      <pointLight
        ref={rocketLight}
        color="#ffcc66"
        intensity={4.2}
        distance={10}
        decay={2}
      />
    </>
  );
}

/* ✨ Happy Diwali Text */
function GlowingText({ yOffset = 0 }) {
  const textRef = useRef();
  const lightRef = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1.0 + Math.sin(t * 1.5) * 0.4;
    textRef.current.material.emissiveIntensity = pulse;
    lightRef.current.intensity = 4.5 + Math.sin(t * 1.2) * 1.5;
  });
  return (
    <Center top position={[0, yOffset, 0]}>
      <Text3D
        ref={textRef}
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.9}
        height={0.25}
        bevelEnabled
        bevelThickness={0.04}
        bevelSize={0.02}
        bevelSegments={3}
      >
        Happy Diwali
        <meshStandardMaterial
          color="#ffcc33"
          emissive="#ff9933"
          emissiveIntensity={1.2}
          metalness={0.5}
          roughness={0.3}
        />
      </Text3D>
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        intensity={5}
        distance={7}
        color="#ffcc88"
      />
    </Center>
  );
}

/* 🪔 Lakshmi Statue */
function LakshmiModel({ position, scale, refProp }) {
  const gltf = useGLTF(lakshmiUrl);
  const groupRef = refProp || useRef();
  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: "#b8860b",
          metalness: 0.9,
          roughness: 0.35,
          clearcoat: 0.4,
          clearcoatRoughness: 0.3,
          sheen: 0.5,
          emissive: "#3f2500",
          emissiveIntensity: 0.05,
        });
      }
    });
  }, [gltf]);
  return (
    <group ref={groupRef} position={position} scale={scale}>
      <hemisphereLight intensity={0.25} skyColor="#ffd7a0" groundColor="#1a1000" />
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

/* 🌌 Main Scene */
export default function LandingPage() {
  const [rockets, setRockets] = useState([]);
  const [fireworks, setFireworks] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const [sceneVisible, setSceneVisible] = useState(false);
  const { progress } = useProgress();

  const ambientRef = useRef();
  const lakshmiRef = useRef();
  const [flashAnim] = useState({
    active: false,
    startTime: 0,
    color: "#fff6cc",
  });

  useEffect(() => {
    if (progress === 100) setTimeout(() => setSceneVisible(true), 500);
  }, [progress]);

  useEffect(() => {
    const check = () => {
      const mq = window.matchMedia?.("(pointer: coarse), (max-width: 720px)");
      setIsMobile(mq ? mq.matches : window.innerWidth <= 720);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLaunch = (startPosition) => {
    const id = crypto.randomUUID();
    const startVec = new THREE.Vector3(...startPosition);
    setRockets((prev) => [...prev, { id, start: startVec }]);
  };

  const handleExplode = (pos, id) => {
    try {
      const audio = crackleAudio.cloneNode();
      audio.play().catch(() => {});
    } catch {}
    const colors = ["#ffb347", "#ff4d4d", "#4dd2ff", "#cc66ff", "#00ffcc"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    flashAnim.active = true;
    flashAnim.startTime = performance.now() / 1000;
    flashAnim.color = color;
    setFireworks((p) => [
      ...p,
      { id: crypto.randomUUID(), position: [pos.x, pos.y, pos.z], color },
    ]);
    setRockets((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: sceneVisible ? 1 : 0,
          transition: "opacity 1s ease-in-out",
        }}
      >
        <Canvas
          camera={
            isMobile
              ? { position: [0, 3.5, 14], fov: 72 }
              : { position: [0, 5, 12], fov: 60 }
          }
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputEncoding: THREE.sRGBEncoding,
          }}
        >
          <color attach="background" args={["#030008"]} />
          <ambientLight ref={ambientRef} intensity={0.4} color="#fff6cc" />
          <AmbientFlashController
            ambientRef={ambientRef}
            flashAnim={flashAnim}
            lakshmiRef={lakshmiRef}
          />
          <pointLight position={[5, 5, 5]} intensity={0.5} />
          <OrbitControls enableZoom={!isMobile} autoRotate autoRotateSpeed={0.25} />

          {/* 🌌 Responsive glowing stars */}
          <GlowingStars count={isMobile ? 1200 : 3000} flashAnim={flashAnim} />

          <Suspense fallback={null}>
            <LakshmiModel
              refProp={lakshmiRef}
              position={isMobile ? [0, -1, -6] : [0, -2, -12]}
              scale={isMobile ? 1.6 : 3.0}
            />
            <GlowingText yOffset={isMobile ? 3 : 0} />

            <FloatingOption
              label="🪔 Diya Garden"
              color="#ff9933"
              position={isMobile ? [-3.5, 1.0, 0] : [-6.5, 0.8, 0]}
              onClick={() => navigate("/diya")}
            />
            <FloatingOption
              label="🎨 Rangoli Painter"
              color="#ff66aa"
              position={isMobile ? [3.5, 1.0, 0] : [6.5, 0.8, 0]}
              onClick={() => navigate("/rangoli")}
            />

            {[[-3, -1.2, 0], [0, -1.2, 0], [3, -1.2, 0]].map((pos, i) => (
              <LaunchPad key={i} position={pos} onClick={handleLaunch} />
            ))}
            {rockets.map((r) => (
              <TrailRocket key={r.id} start={r.start} onExplode={(pos) => handleExplode(pos, r.id)} />
            ))}
            {fireworks.map((fw) => (
              <Firework key={fw.id} position={fw.position} color={fw.color} />
            ))}
          </Suspense>

          {!isMobile && (
            <EffectComposer>
              <Bloom intensity={0.55} luminanceThreshold={0.25} luminanceSmoothing={0.9} />
              <ChromaticAberration offset={[0.0005, 0.0008]} blendFunction={BlendFunction.NORMAL} />
              <Noise opacity={0.012} />
              <Vignette eskil={false} offset={0.2} darkness={0.55} />
            </EffectComposer>
          )}
        </Canvas>
      </div>
      <Loader />
    </div>
  );
}
