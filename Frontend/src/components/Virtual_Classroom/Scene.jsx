// Scene.jsx
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useControls } from 'leva';
import { useRef, useState } from 'react';
import Classroom from './Classroom';
import Blackboard from './Blackboard';
import RightBoard from './RightBoard';
import LeftBoard from './LeftBoard';
import { useVirtualClassroom } from '../../contexts/VirtualClassroomContext';

const CameraController = () => {
  const { camera } = useThree();
  const { rotY } = useControls('Camera', {
    rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });

  useFrame(() => {
    camera.position.set(-1, 7.4, 9);
    camera.rotation.set(0, rotY, 0);
  });

  return null;
};

const Scene = () => {
  const controlsRef = useRef();
  const { roomId } = useVirtualClassroom();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy!', err));
  };

  return (
    <div className="relative w-full h-full">
      <Canvas className="w-full h-full" camera={{ position: [-1, 7.4, 9], fov: 50 }}>
        <ambientLight intensity={1} />
        <Environment preset="sunset" />

        <CameraController />
        <Classroom />
        <Blackboard />
        <RightBoard />
        <LeftBoard />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={false}
        />
      </Canvas>

      {/* Room ID overlay */}
      {roomId && (
        <div
          onClick={handleCopy}
          className="absolute top-5 left-5 bg-black bg-opacity-60 text-white px-3 py-2 rounded-md font-sans text-base z-10 shadow-lg cursor-pointer select-none flex items-center space-x-2"
          title="Click to copy Room ID"
        >
          <span>📋</span>
          <span>Room ID: <span className="font-bold">{roomId}</span></span>
          {copied && <span className="text-green-400 font-normal">✅ Copied!</span>}
        </div>
      )}
    </div>
  );
};

export default Scene;
