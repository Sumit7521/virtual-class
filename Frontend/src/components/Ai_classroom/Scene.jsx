"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Gltf, Loader, CameraControls, useGLTF, useAnimations } from "@react-three/drei";
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
function RahulSir({ isThinking, aiAnswered }) {
  const { scene, animations } = useGLTF("/models/rahulsir.glb");
  const { actions } = useAnimations(animations, scene);
  const [currentAction, setCurrentAction] = useState(null);
  const [enterAnimationPlayed, setEnterAnimationPlayed] = useState(false);

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;

    // Console all animations
    console.log("Rahul Sir animations:");
    Object.keys(actions).forEach((key, idx) => console.log(idx, key));

    // Play enter animation once
    if (!enterAnimationPlayed) {
      const enterAction = actions[Object.keys(actions)[6]]; // waving
      enterAction.reset().setLoop(THREE.LoopOnce).play();
      enterAction.clampWhenFinished = true;
      setCurrentAction(enterAction);
      setEnterAnimationPlayed(true);

      enterAction.getMixer().addEventListener("finished", () => {
        const idleAction = actions[Object.keys(actions)[4]]; // idle2
        idleAction.reset().play();
        setCurrentAction(idleAction);
      });
    }
  }, [actions, enterAnimationPlayed]);

  // Handle thinking animation
  useEffect(() => {
    if (!actions || !currentAction) return;
    if (isThinking) {
      const thinkAction = actions[Object.keys(actions)[4]]; // idle2 / waiting
      if (currentAction !== thinkAction) {
        currentAction.fadeOut(0.2);
        thinkAction.reset().fadeIn(0.2).play();
        setCurrentAction(thinkAction);
      }
    }
  }, [isThinking, actions, currentAction]);

  // Handle answer animation once after AI responds
  useEffect(() => {
    if (!actions || !currentAction || !aiAnswered) return;

    const answerAction = actions[Object.keys(actions)[5]]; // Talking
    answerAction.reset().setLoop(THREE.LoopOnce).play();
    answerAction.clampWhenFinished = true;

    currentAction.fadeOut(0.2);
    setCurrentAction(answerAction);

    answerAction.getMixer().addEventListener("finished", () => {
      const idleAction = actions[Object.keys(actions)[4]]; // idle2
      idleAction.reset().fadeIn(0.2).play();
      setCurrentAction(idleAction);
    });
  }, [aiAnswered, actions]);

  return <primitive object={scene} position={[-2, -1.7, -5]} scale={1.3} />;
}

// ---------------- Blackboard Placeholder ---------------- //
function BlackboardPlaceholder({ text }) {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Comic Sans MS', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "black";
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;

    const words = text.split(" ");
    const lineHeight = 28;
    const maxWidth = canvas.width - 40;
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
    ctx.fillText(line, canvas.width / 2, y);

    const tex = new THREE.CanvasTexture(canvas);
    setTexture(tex);
  }, [text]);

  return (
    <mesh ref={meshRef} position={[0.2, 0.34, -5.5]} rotation={[0, 0, 0]} scale={[2.9, 1.59, 1]}>
      <planeGeometry args={[1, 1]} />
      {texture && <meshBasicMaterial map={texture} transparent />}
    </mesh>
  );
}

// ---------------- Backend AI Call ---------------- //
async function askRahulBackend(question) {
  try {
    const res = await fetch("https://immersio.onrender.com/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error("Failed to get AI response");
    const data = await res.json();

    if (data.audio) {
      const audio = new Audio("data:audio/mp3;base64," + data.audio);
      audio.play().catch(err => console.error("Audio play failed:", err));
    }

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
  const [isThinking, setIsThinking] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);
  const [aiAnswered, setAiAnswered] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
    const userQuestion = input;
    setInput("");
    setAnswer("Thinking...");
    setIsThinking(true);
    setHasAsked(true);
    setAiAnswered(false);

    const aiAnswer = await askRahulBackend(userQuestion);
    setAnswer(aiAnswer);
    setIsThinking(false);
    setAiAnswered(true);
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
          <RahulSir isThinking={isThinking} aiAnswered={aiAnswered} />
          <BlackboardPlaceholder text={answer} />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-lg p-4 space-y-2">
          <h2 className="text-white text-lg font-semibold text-left">
            Ask Rahul Sir a Python Question 💬
          </h2>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="text"
              placeholder="Type your Python question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAsk(); }}
              className="flex-1 bg-transparent text-white placeholder-gray-300 focus:outline-none focus:ring-0 px-3 py-2 rounded-full"
            />
            <button
              onClick={handleAsk}
              className="px-5 py-2 rounded-full bg-white/30 hover:bg-white/40 text-white font-medium transition-all"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Preload Models ---------------- //
useGLTF.preload("/models/Ai_classroom.glb");
useGLTF.preload("/models/rahulsir.glb");
