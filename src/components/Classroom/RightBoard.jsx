// components/RightBoard.jsx
import React from 'react';
import { Html } from '@react-three/drei';
import { useControls } from 'leva';

const dummyChats = [
  "Hello! 👋",
  "Welcome to the virtual classroom.",
  "Let's begin our session.",
  "Feel free to ask any questions.",
  "Scroll is working perfectly!",
  "Lorem ipsum dolor sit amet.",
  "This is a dummy chat message.",
  "Another message here...",
  "Yet another message...",
  "Keep scrolling!",
  "You reached the bottom 🎉",
];

const RightBoard = () => {
  // Leva controls for position, rotation, and scale
  const {
    posX, posY, posZ,
    rotX, rotY, rotZ,
    scaleX, scaleY,
  } = useControls('RightBoard', {
    posX: { value: 11.6, min: -5, max: 20, step: 0.1 },
    posY: { value: 10.3, min: 0, max: 20, step: 0.1 },
    posZ: { value: -17.2, min: -50, max: 5, step: 0.1 },
    rotX: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotY: { value: 0 , min: -Math.PI, max: Math.PI, step: 0.01 },
    rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    scaleX: { value: 1, min: 0.5, max: 3, step: 0.1 },
    scaleY: { value: 2.3, min: 0.5, max: 3, step: 0.1 },
  });

  const baseWidth = 2.2;
  const baseHeight = 1.4;

  const scaledWidth = baseWidth * scaleX;
  const scaledHeight = baseHeight * scaleY;

  return (
    <group position={[posX, posY, posZ]} rotation={[rotX, rotY, rotZ]}>
      <Html
        position={[0, 0, 0.01]} // Slightly in front of where the board would be
        transform
        occlude
        style={{
          pointerEvents: 'auto',
          width: `${scaledWidth * 100}px`,
          height: `${scaledHeight * 100}px`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '10px',
            padding: '12px',
            boxSizing: 'border-box',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {dummyChats.map((msg, i) => (
            <div
              key={i}
              style={{
                padding: '6px 8px',
                background: '#333',
                borderRadius: '6px',
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      </Html>
    </group>
  );
};

export default RightBoard;
