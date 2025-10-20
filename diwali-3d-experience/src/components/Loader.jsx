import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";

export default function Loader() {
  const { progress } = useProgress();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => setFadeOut(true), 500);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at center, #0b081a 0%, #000 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 1s ease-in-out",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          border: "6px solid #ffcc33",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "1rem",
          boxShadow: "0 0 25px #ffcc33aa",
        }}
      />
      <p
        style={{
          fontFamily: "Poppins, sans-serif",
          color: "#ffcc33",
          fontSize: "1.3rem",
          letterSpacing: "1px",
          textShadow: "0 0 10px #ffcc33aa",
        }}
      >
        {Math.floor(progress)}% Loaded
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
