// scenes/Scene.jsx
// import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import { OrbitControls, Environment } from '@react-three/drei';
// import { useEffect } from 'react';
// import Classroom from './Classroom';
// import Blackboard from './Blackboard';
// import RightBoard from './RightBoard';

// const CameraController = () => {
// }

// const Scene = () => {
//   return (
//     <Canvas camera={{ position: [-0.4, 9.0, 7.2], fov: 75 }}>
//       <ambientLight intensity={1} />
//       <Environment preset="sunset" />
//       <CameraController />
//       <Classroom />
//       <Blackboard />
//       <RightBoard />
//       <OrbitControls />
//     </Canvas>
//   );
// };

// export default Scene;


// scenes/Scene.jsx
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useControls } from 'leva';
import { useRef, useEffect } from 'react';
import Classroom from './Classroom';
import Blackboard from './Blackboard';
import RightBoard from './RightBoard';

const CameraController = () => {
  const { camera } = useThree();

  const controls = useControls('Camera', {
    camX: { value: 0, min: -10, max: 10, step: 0.1 },
    camY: { value: 7.2, min: -10, max: 10, step: 0.1 },
    camZ: { value: 10, min: -10, max: 10, step: 0.1 },
    rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });

  useFrame(() => {
    camera.position.set(controls.camX, controls.camY, controls.camZ);
    camera.rotation.set(controls.rotX, controls.rotY, controls.rotZ);
  });

  return null;
};

const Scene = () => {
  return (
    <Canvas camera={{ position: [0, 2, 2], fov: 50 }}>
      <ambientLight intensity={1} />
      <Environment preset="sunset" />
      <CameraController />
      <Classroom />
      <Blackboard />
      <RightBoard />
      <OrbitControls />
    </Canvas>
  );
};
export default Scene;
