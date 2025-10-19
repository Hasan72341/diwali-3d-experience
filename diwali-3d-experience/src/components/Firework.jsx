import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useState } from "react";

const vertexShader = `
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 130.0 / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, 1.0 - smoothstep(0.3, 0.5, d));
  }
`;

export default function Firework({ position }) {
  const mesh = useRef();
  const [life, setLife] = useState(0);
  const count = 220; // fewer for perf

  const color = useMemo(
    () => new THREE.Color(`hsl(${Math.random() * 360},100%,70%)`),
    []
  );

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).multiplyScalar(Math.random() * 0.3 + 0.1);
      p.set([0, 0, 0], i * 3);
      vel.push(dir);
    }
    mesh.currentVel = vel;
    return p;
  }, []);

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++)
      c.set([color.r, color.g, color.b], i * 3);
    return c;
  }, [color]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    []
  );

  useFrame((_, delta) => {
    if (!mesh.current) return;
    setLife((prev) => prev + delta);
    const arr = mesh.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const v = mesh.currentVel[i];
      const j = i * 3;
      arr[j] += v.x;
      arr[j + 1] += v.y;
      arr[j + 2] += v.z;
      v.y -= delta * 0.05;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
    mat.opacity = Math.max(0, 1 - life / 4.5);
  });

  if (life > 4.5) return null;

  return (
    <points ref={mesh} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <primitive object={mat} attach="material" />
    </points>
  );
}
