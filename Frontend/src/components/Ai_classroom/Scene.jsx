"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Gltf, Loader, CameraControls, useGLTF, useAnimations } from "@react-three/drei";
import { useControls, button } from "leva";

// ---------------- Camera Presets ---------------- //
const CAMERA_POSITIONS = {
  default: [0, 6.123233995736766e-21, 0.0001],
  loading: [0.00002621880610890309, 0.00000515037441056466, 0.00009636414192870058],
  speaking: [0, -1.6481333940859815e-7, 0.00009999846226827279],
};

const CAMERA_ZOOMS = {
  default: 1,
  loading: 1.3,
  speaking: 2.1204819420055387,
};

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

// ---------------- Main Scene ---------------- //
export default function Scene() {
  const [input, setInput] = useState("");

  const handleAsk = () => {
    console.log("User Question:", input);
    setInput(""); // clear after asking
  };

  return (
    <div className="h-screen w-screen relative">
      <Loader />
      <Canvas
        camera={{
          position: [0, 1, 5],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
      >
        <CameraManager />

        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />

        {/* Models */}
        <Suspense fallback={null}>
          <Gltf
            src="/models/Ai_classroom.glb"
            position={[0, -1.7, -2]}
            scale={1}
          />

          <RahulSir />

          <Environment preset="sunset" />
        </Suspense>
      </Canvas>

            {/* Chat Panel (Glass Card Style) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
                      w-[90%] max-w-2xl">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 
                        rounded-2xl shadow-lg p-6 space-y-4">
          
          {/* Title & Subtitle */}
          <div>
            <h2 className="text-lg font-semibold text-white">
              How to ask Rahul Sir?
            </h2>
            <p className="text-sm text-gray-200">
              Type your Python question and Rahul Sir will explain it to you.
            </p>
          </div>

          {/* Input + Button */}
          <div className="flex items-center bg-[#514850] rounded-full px-3 py-2">
            <input
              type="text"
              placeholder="Write your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-300 
                         focus:outline-none focus:ring-0 px-2 text-base"
            />
            <button
              onClick={handleAsk}
              className="ml-2 px-5 py-2 rounded-full bg-white/30 
                         hover:bg-white/40 text-white font-medium transition-all"
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
