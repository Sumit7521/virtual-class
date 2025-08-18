"use client";
import { Suspense, useEffect, useRef } from "react";
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

  // 🎬 Play first animation automatically
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = actions[Object.keys(actions)[0]];
      firstAction.reset().play();
    }
  }, [actions]);

  // 🎛 Leva controls for position & scale
  const { position, scale } = useControls("Rahul Sir", {
    position: { value: [-2, -1.7, -5], step: 0.1 },
    scale: { value: 1.3, min: 0.5, max: 3, step: 0.1 },
  });

  return <primitive object={scene} position={position} scale={scale} />;
}

// ---------------- Main Scene ---------------- //
export default function Scene() {
  return (
    <div className="h-screen w-screen">
      <Loader />
      <Canvas
        camera={{
          position: [0, 1, 5],
          fov: 40,
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
          {/* Classroom */}
          <Gltf
            src="/models/Ai_classroom.glb"
            position={[0, -1.7, -2]}
            scale={1}
          />

          {/* Rahul Sir */}
          <RahulSir />

          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ---------------- Preload Models ---------------- //
useGLTF.preload("/models/Ai_classroom.glb");
useGLTF.preload("/models/rahulsir.glb");
