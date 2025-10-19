import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  useGLTF,
  Trail,
  Text3D,
  Center,
} from "@react-three/drei";
import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import Firework from "../components/Firework";
import FloatingOption from "../components/FloatingOption";
/* 🪔 Lakshmi GLTF */
import lakshmiUrl from "../assets/lakshmi_3d_model/scene.gltf?url";
useGLTF.preload(lakshmiUrl);
import {
  EffectComposer,
  ChromaticAberration,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/* 🔊 preload crackle sound */
const crackleAudio = new Audio("/crackle.mp3");
crackleAudio.volume = 0.4;

/* 🧱 LaunchPad GLTF model */
import jumpPadUrl from "../assets/sm_jumppad/scene.gltf?url";
useGLTF.preload(jumpPadUrl);

function LaunchPad({ position, onClick }) {
  const gltf = useGLTF(jumpPadUrl);

  useEffect(() => {
    const orig = console.warn;
    console.warn = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("KHR_materials_pbrSpecularGlossiness")
      )
        return;
      orig(...args);
    };
    return () => (console.warn = orig);
  }, []);

  return (
    <group
      position={position}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick(position);
      }}
    >
      <primitive object={gltf.scene.clone()} scale={2.0} position={[0, -3, 0]} />
    </group>
  );
}

/* 🚀 Smooth trail rocket with light */
function TrailRocket({ start, onExplode }) {
  const pos = useRef(start.clone ? start.clone() : new THREE.Vector3(...start));
  const velocity = useRef(
    new THREE.Vector3(
      (Math.random() - 0.5) * 0.25,
      1.0,
      (Math.random() - 0.5) * 0.25
    )
      .normalize()
      .multiplyScalar(0.35)
  );
  const [exploded, setExploded] = useState(false);
  const rocketLight = useRef();

  const maxHeight = pos.current.y + 5 + Math.random() * 1.2;

  useFrame((_, delta) => {
    if (exploded) return;
    pos.current.addScaledVector(velocity.current, delta * 60);
    rocketLight.current.position.copy(pos.current);
    if (pos.current.y >= maxHeight) {
      setExploded(true);
      onExplode(pos.current.clone());
    }
  });

  if (exploded) return null;

  return (
    <Trail
      width={2.2}
      color="#ffd288"
      length={2.0}
      decay={3.0}
      local={false}
      attenuation={(t) => t * t}
    >
      <pointLight
        ref={rocketLight}
        color="#ffbb66"
        intensity={2.4}
        distance={7}
        decay={2}
      />
    </Trail>
  );
}

/* ✨ Glowing 3D “Happy Diwali” text */
function GlowingText({ yOffset = 0, isMobile = false }) {
  const textRef = useRef();
  const lightRef = useRef();
  const happyMatRef = useRef();
  const diyaMatRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1.2 + Math.sin(t * 1.5) * 0.5; // smooth breathing
    const lightPulse = 6 + Math.sin(t * 1.5) * 1.5;

    if (textRef.current)
      textRef.current.material.emissiveIntensity = pulse;
    if (lightRef.current) lightRef.current.intensity = lightPulse;

    // animate split-text materials if present
    const tt = clock.getElapsedTime();
    const p = (Math.sin(tt * 1.5) + 1) * 0.5; // 0..1
    if (happyMatRef.current) {
      const c = new THREE.Color().setHSL(0.12 + p * 0.02, 0.9, 0.55);
      happyMatRef.current.color.copy(c);
      happyMatRef.current.emissive.copy(c.clone().multiplyScalar(0.7));
    }
    if (diyaMatRef.current) {
      const c2 = new THREE.Color().setHSL(0.08 + p * 0.025, 0.95, 0.52);
      diyaMatRef.current.color.copy(c2);
      diyaMatRef.current.emissive.copy(c2.clone().multiplyScalar(0.75));
    }
  });

  return (
    <Center top position={[0, yOffset + (isMobile ? 0.6 : 0), 0]}>
      {isMobile ? (
        <group>
          <Text3D
            ref={textRef}
            font="/fonts/helvetiker_regular.typeface.json"
            size={0.85}
            height={0.25}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.04}
            bevelSize={0.02}
            bevelOffset={0}
            bevelSegments={3}
            position={[0, 0.6, 0]} // increased spacing up
          >
            Happy
            <meshStandardMaterial
              ref={happyMatRef}
              color="#ffcc33"
              emissive="#ff9933"
              emissiveIntensity={1.2}
              metalness={0.5}
              roughness={0.3}
            />
          </Text3D>

          <Text3D
            font="/fonts/helvetiker_regular.typeface.json"
            size={0.85}
            height={0.25}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.04}
            bevelSize={0.02}
            bevelOffset={0}
            bevelSegments={3}
            position={[0, -0.4, 0]} // increased spacing down
          >
            Diwali
            <meshStandardMaterial
              ref={diyaMatRef}
              color="#ffcc33"
              emissive="#ff9933"
              emissiveIntensity={1.2}
              metalness={0.5}
              roughness={0.3}
            />
          </Text3D>
        </group>
      ) : (
        <Text3D
          ref={textRef}
          font="/fonts/helvetiker_regular.typeface.json"
          size={1}
          height={0.3}
          curveSegments={16}
          bevelEnabled
          bevelThickness={0.05}
          bevelSize={0.03}
          bevelOffset={0}
          bevelSegments={4}
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
      )}

      {/* 💡 Point light inside the text */}
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        intensity={6}
        distance={8}
        color="#ffcc88"
      />
    </Center>
  );
}

// color/emissive animation runs inside GlowingText's useFrame

function LakshmiModel({ position = [0, -1, 0], scale = 5.0, rotation = [0, Math.PI/2, 0] }) {
  const gltf = useGLTF(lakshmiUrl);

  // small local warn suppression for this model's loader extension warning
  useEffect(() => {
    const orig = console.warn;
    console.warn = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("KHR_materials_pbrSpecularGlossiness")
      )
        return;
      orig(...args);
    };
    return () => (console.warn = orig);
  }, []);

  return (
    <group position={position} scale={scale} rotation={[0, rotation[0], 0]}>
      {/* subtle area lighting for the statue */}
      <hemisphereLight intensity={0.6} groundColor="#222" />
      <pointLight position={[0, 2, 2]} intensity={1.2} color="#fff8e6" />
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

  useEffect(() => {
    const check = () => {
      // treat narrow screens or touch devices as mobile
      const mq = typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(pointer: coarse), (max-width: 720px)")
        : null;
      setIsMobile(
        !!(
          mq ? mq.matches : (typeof window !== "undefined" && window.innerWidth <= 720)
        )
      );
    };
    check();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", check);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", check);
      }
    };
  }, []);

  const handleLaunch = (startPosition) => {
    const id = crypto.randomUUID();
    const startVec =
      startPosition instanceof THREE.Vector3
        ? startPosition
        : new THREE.Vector3(...startPosition);
    setRockets((prev) => [...prev, { id, start: startVec }]);
  };

  const handleExplode = (pos, id) => {
    try {
      const audio = crackleAudio.cloneNode();
      audio.play().catch(() => {});
    } catch {}
    setFireworks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), position: [pos.x, pos.y, pos.z] },
    ]);
    setRockets((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <Canvas
        camera={
          isMobile
            ? { position: [0, 3.5, 14], fov: 72 } // zoom out more on mobile
            : { position: [0, 5, 12], fov: 60 }
        }
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputEncoding: THREE.sRGBEncoding,
        }}
      >
        <color attach="background" args={["#030008"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={0.6} />
        <OrbitControls enableZoom={!isMobile} autoRotate autoRotateSpeed={0.3} />
        <Stars radius={50} count={isMobile ? 800 : 3000} factor={2} fade />

        <Suspense fallback={null}>
          {/* Lakshmi statue in the far background */}
          <LakshmiModel
            position={isMobile ? [0, -1, -6] : [0, -2, -12]}
            scale={isMobile ? 1.6 : 3.0}
            rotY={0}
          />

          <GlowingText yOffset={isMobile ? 3 : 0} isMobile={isMobile} />

          {/* Floating Buttons */}
          <FloatingOption
            // label="🪔 Diya Garden"
            color="#ff9933"
            position={isMobile ? [-3.5, 1.0, 0] : [-6.5, 0.8, 0]}
            // onClick={() => navigate("/diya")}
          />
          <FloatingOption
            // label="🎨 Rangoli Painter"
            color="#ff66aa"
            position={isMobile ? [3.5, 1.0, 0] : [6.5, 0.8, 0]}
            // onClick={() => navigate("/rangoli")}
          />

          {/* 🚀 Launchpads */}
          {([[-3, -1.2, 0], [0, -1.2, 0], [3, -1.2, 0]]).map((pos, i) => {
            const x = isMobile ? pos[0] * 0.8 : pos[0];
            const y = isMobile ? pos[1] + 0.6 : pos[1];
            return (
              <LaunchPad key={i} position={[x, y, pos[2]]} onClick={handleLaunch} />
            );
          })}

          {/* 🚀 Rockets */}
          {rockets.map((r) => (
            <TrailRocket
              key={r.id}
              start={r.start}
              onExplode={(pos) => handleExplode(pos, r.id)}
            />
          ))}

          {/* 💥 Fireworks */}
          {fireworks.map((fw) => (
            <Firework key={fw.id} position={fw.position} />
          ))}
        </Suspense>

        {/* ✨ Subtle post effects */}
        {!isMobile && (
          <EffectComposer>
            <ChromaticAberration
              offset={[0.0007, 0.001]}
              blendFunction={BlendFunction.NORMAL}
            />
            <Noise opacity={0.015} />
            <Vignette eskil={false} offset={0.15} darkness={0.55} />
          </EffectComposer>
        )}
      </Canvas>

      <p
        style={{
          position: "absolute",
          bottom: 10,
          width: "100%",
          textAlign: "center",
          color: "#aaa",
          fontSize: 14,
        }}
      >
        Click a launchpad to fire a rocket 🎆
      </p>
    </div>
  );
}
