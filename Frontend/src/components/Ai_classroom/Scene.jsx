"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Gltf, Loader, CameraControls, useGLTF, useAnimations } from "@react-three/drei";
import { useControls, button } from "leva";
import * as THREE from "three";

// ---------------- Camera Presets ---------------- //
const CAMERA_POSITIONS = { default: [0, 6.123233995736766e-21, 0.0001] };
const CAMERA_ZOOMS = { default: 1 };

// ---------------- Camera Manager ---------------- //
const CameraManager = () => {
  const controls = useRef();

  useEffect(() => {
    controls.current?.setPosition(...CAMERA_POSITIONS.default, true);
    controls.current?.zoomTo(CAMERA_ZOOMS.default, true);
  }, []);

  useControls("Helper", {
    getCameraPosition: button(() => {
      const position = controls.current.getPosition();
      const zoom = controls.current.camera.zoom;
      console.log([...position], zoom);
    }),
  });

  return (
    <CameraControls
      ref={controls}
      minZoom={1}
      maxZoom={3}
      polarRotateSpeed={-0.3}
      azimuthRotateSpeed={-0.3}
      mouseButtons={{ left: 1, wheel: 16 }}
      touches={{ one: 32, two: 512 }}
    />
  );
};

// ---------------- Rahul Sir Model ---------------- //
function RahulSir() {
  const { scene, animations } = useGLTF("/models/rahulsir.glb");
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = actions[Object.keys(actions)[0]];
      firstAction.reset().play();
    }
  }, [actions]);

  const { position, scale } = useControls("Rahul Sir", {
    position: { value: [-2, -1.7, -5], step: 0.1 },
    scale: { value: 1.3, min: 0.5, max: 3, step: 0.1 },
  });

  return <primitive object={scene} position={position} scale={scale} />;
}

// ---------------- Blackboard Placeholder ---------------- //
function BlackboardPlaceholder({ text }) {
  const meshRef = useRef();

  const { position, rotation, scale } = useControls("Blackboard", {
    position: { value: [0.2, 0.34, -5.5], step: 0.01 },
    rotation: { value: [0, 0, 0], step: 0.01 },
    scale: { value: [2.9, 1.59, 1], step: 0.01 },
  });

  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial"; // smaller font
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const words = text.split(" ");
    const lineHeight = 24;
    const maxWidth = canvas.width - 20; // padding
    let line = "";
    let y = 10;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y); // last line

    const tex = new THREE.CanvasTexture(canvas);
    setTexture(tex);
  }, [text]);

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1]} />
      {texture && <meshBasicMaterial map={texture} transparent />}
    </mesh>
  );
}

// ---------------- Backend AI Call ---------------- //
async function askRahulBackend(question) {
  try {
    const res = await fetch("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error("Failed to get AI response");
    const data = await res.json();
    return data.query_response || "Sorry, Rahul Sir has no answer right now.";
  } catch (err) {
    console.error("AI backend error:", err);
    return "Sorry, Rahul Sir is not available right now.";
  }
}

// ---------------- Main Scene ---------------- //
export default function Scene() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = async () => {
    if (!input.trim()) return;
    const userQuestion = input;
    setInput("");
    setAnswer("Thinking...");
    const aiAnswer = await askRahulBackend(userQuestion);
    setAnswer(aiAnswer);
  };

  return (
    <div className="h-screen w-screen relative">
      <Loader />
      <Canvas camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 1000 }}>
        <CameraManager />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <Suspense fallback={null}>
          <Gltf src="/models/Ai_classroom.glb" position={[0, -1.7, -2]} scale={1} />
          <RahulSir />
          <BlackboardPlaceholder text={answer} />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Ask Rahul Sir</h2>
            <p className="text-sm text-gray-200">
              Type your Python question and Rahul Sir will explain it to you.
            </p>
          </div>
          <div className="flex items-center bg-[#514850] rounded-full px-3 py-2">
            <input
              type="text"
              placeholder="Write your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
              className="flex-1 bg-transparent text-white placeholder-gray-300 focus:outline-none focus:ring-0 px-2 text-base"
            />
            <button
              onClick={handleAsk}
              className="ml-2 px-5 py-2 rounded-full bg-white/30 hover:bg-white/40 text-white font-medium transition-all"
            >
              Ask
            </button>
          </div>
          {answer && (
            <div className="mt-2 p-3 bg-white/20 rounded-lg text-white">
              <strong>Rahul Sir says:</strong> {answer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Preload Models ---------------- //
useGLTF.preload("/models/Ai_classroom.glb");
useGLTF.preload("/models/rahulsir.glb");
