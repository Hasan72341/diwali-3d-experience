// src/pages/RangoliPainter.jsx
import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/* =========================
   Simple Petal Component
   ========================= */
function Petal({ position, rotation, color }) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow>
      <coneGeometry args={[0.18, 0.3, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        metalness={0.25}
        roughness={0.35}
      />
    </mesh>
  );
}

/* =========================
   Lightweight GPU Sparkle Burst
   - uses a small shader for circular soft points
   - auto-fades and not heavy on CPU
   ========================= */
function SparkleBurst({ position = [0, 0.1, 0], color = "#ffd966", count = 60, life = 1.2, onDone }) {
  const meshRef = useRef();
  const start = useRef(performance.now() / 1000);

  // Geometry: random offsets within a small sphere / disk
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // emit mostly upward and slightly outwards
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() * Math.PI) / 4; // cone angle
      const r = 0.02 + Math.random() * 0.06;
      const x = Math.cos(theta) * Math.sin(phi) * r;
      const y = Math.cos(phi) * (0.06 + Math.random() * 0.16);
      const z = Math.sin(theta) * Math.sin(phi) * r;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // small velocities to give spread (direction normalized * speed)
      const vx = x * (0.5 + Math.random() * 1.2);
      const vy = y * (0.9 + Math.random() * 1.4);
      const vz = z * (0.5 + Math.random() * 1.2);
      vel[i * 3] = vx;
      vel[i * 3 + 1] = vy;
      vel[i * 3 + 2] = vz;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("velocity", new THREE.BufferAttribute(vel, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // shader material for soft round points with fade
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uStart: { value: start.current },
        uLife: { value: life },
        uColor: { value: new THREE.Color(color) },
        uPointSize: { value: 40.0 }, // GPU size (will be scaled by perspective)
      },
      vertexShader: `
        attribute vec3 velocity;
        uniform float uTime;
        uniform float uStart;
        uniform float uLife;
        uniform float uPointSize;
        varying float vAge;
        void main() {
          float t = uTime - uStart;
          vAge = t;
          // compute particle position = initial offset + velocity * t, plus gravity-like drop
          vec3 pos = position + velocity * t + vec3(0.0, -0.6 * t * t, 0.0);
          vec4 mvPosition = modelViewMatrix * vec4(pos + vec3(${position[0]}, ${position[1]}, ${position[2]}), 1.0);
          gl_Position = projectionMatrix * mvPosition;
          // size gets smaller with distance; keep it modest
          gl_PointSize = uPointSize * (1.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uLife;
        varying float vAge;
        void main() {
          float age = clamp(vAge / uLife, 0.0, 1.0);
          // radial soft disc
          float d = length(gl_PointCoord - vec2(0.5));
          float alpha = smoothstep(0.5, 0.0, d);
          // fade out toward end of life
          float fade = 1.0 - age;
          fade = pow(fade, 1.2);
          gl_FragColor = vec4(uColor * (0.6 + 0.4 * (1.0 - age)), alpha * fade);
        }
      `,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, life, position]);

  // update time uniform each frame; remove after life+small buffer
  useFrame(() => {
    if (!material) return;
    const now = performance.now() / 1000;
    material.uniforms.uTime.value = now;
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      onDone?.();
      // cleanup geometry & material to free GPU memory
      geometry.dispose();
      material.dispose();
    }, (life + 0.15) * 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <points ref={meshRef} geometry={geometry} material={material} />
  );
}

/* =========================
   Rangoli Canvas (click-handling)
   ========================= */
function RangoliCanvas({ symmetry, palette, petals, setPetals, addSparkle }) {
  function handleClick(e) {
    e.stopPropagation();
    const p = e.point;
    const radius = Math.sqrt(p.x * p.x + p.z * p.z);
    const baseAngle = Math.atan2(p.z, p.x);
    const color = palette[Math.floor(Math.random() * palette.length)];

    // create symmetric petals
    const newPetals = [];
    for (let i = 0; i < symmetry; i++) {
      const angle = baseAngle + (i * Math.PI * 2) / symmetry;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      newPetals.push({
        position: [x, 0.05, z],
        rotation: angle + Math.PI / 2,
        color,
      });
    }
    setPetals((prev) => [...prev, ...newPetals]);

    // add a sparkle burst at click (slightly elevated)
    addSparkle({ position: [p.x, 0.12, p.z], color });
  }

  return (
    <>
      {/* clickable base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={handleClick} receiveShadow>
        <circleGeometry args={[4, 128]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.26} />
      </mesh>

      {/* petals */}
      {petals.map((p, i) => (
        <Petal key={i} position={p.position} rotation={p.rotation} color={p.color} />
      ))}
    </>
  );
}

/* =========================
   Main Page Component
   ========================= */
export default function RangoliPainter() {
  const palette = ["#ff66aa", "#66ffcc", "#ffd966", "#66a3ff", "#ff9966", "#cc99ff"];
  const symmetry = 8;

  const [petals, setPetals] = useState([]);
  const [sparkles, setSparkles] = useState([]); // { id, position, color }

  // add one sparkle burst; will be removed by SparkleBurst's onDone
  function addSparkle({ position, color }) {
    const id = crypto.randomUUID();
    setSparkles((s) => [...s, { id, position, color }]);
  }
  function removeSparkle(id) {
    setSparkles((s) => s.filter((x) => x.id !== id));
  }

  const undo = () => setPetals((prev) => prev.slice(0, -symmetry));
  const clear = () => setPetals([]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "radial-gradient(circle at center, #05050a, #020205 88%)",
        overflow: "hidden",
      }}
    >
      <Canvas
        shadows
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 5, 6], fov: 50 }}
      >
        {/* warm ambient + soft directional */}
        <ambientLight intensity={0.45} color="#fff8e1" />
        <directionalLight position={[2, 6, 2]} intensity={0.9} castShadow />
        <directionalLight position={[-3, 3, -2]} intensity={0.35} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} />

        {/* subtle ground and reflection hint */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#050304" roughness={0.6} metalness={0.05} />
        </mesh>

        {/* Rangoli interactive canvas */}
        <RangoliCanvas
          symmetry={symmetry}
          palette={palette}
          petals={petals}
          setPetals={setPetals}
          addSparkle={addSparkle}
        />

        {/* Sparkle bursts (temporary) */}
        {sparkles.map((s) => (
          <SparkleBurst
            key={s.id}
            position={s.position}
            color={s.color}
            count={64}
            life={1.1}
            onDone={() => removeSparkle(s.id)}
          />
        ))}
      </Canvas>

      {/* DOM UI overlay (buttons must be outside Canvas) */}
      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 12,
          zIndex: 10,
          pointerEvents: "none", // default off; children re-enable
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <button
            onClick={undo}
            style={{
              background: "#ff88aa",
              border: "none",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(255,136,170,0.12)",
            }}
          >
            Undo
          </button>
        </div>
        <div style={{ pointerEvents: "auto" }}>
          <button
            onClick={clear}
            style={{
              background: "#66ccff",
              border: "none",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(102,204,255,0.12)",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
