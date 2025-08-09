// Character.jsx
import { SimpleCharacter } from '@react-three/viverse';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom'; // ✅ import navigate

const Character = () => {
  const charRef = useRef();
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate(); // ✅ navigation hook

  // 🎯 Trigger location (University gate)
  const targetPos = { x: 97.97, y: -3.10, z: -7.30 };
  const triggerDistance = 4;

  useFrame(() => {
    if (charRef.current && !showPopup) {
      const pos = charRef.current.position;
      const dist = Math.sqrt(
        (pos.x - targetPos.x) ** 2 +
        (pos.y - targetPos.y) ** 2 +
        (pos.z - targetPos.z) ** 2
      );

      if (dist < triggerDistance) {
        console.log('🚀 Character reached trigger zone!');
        setShowPopup(true);
      }
    }
  });

  return (
    <>
      <SimpleCharacter ref={charRef} />
      {showPopup && (
        <Html
          position={[targetPos.x, targetPos.y + 2, targetPos.z]}
          center
          distanceFactor={8}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 0 20px rgba(0,0,0,0.5)',
              textAlign: 'center',
              minWidth: '200px',
            }}
          >
            <h2>Where do you want to go?</h2>
            <button
              onClick={() => navigate('/ai-classroom')} // ✅ route to AI classroom
              style={{ margin: '5px', padding: '10px', cursor: 'pointer' }}
            >
              AI Classroom
            </button>
            <button
              onClick={() => navigate('/virtual-classroom')} // ✅ route to Virtual classroom
              style={{ margin: '5px', padding: '10px', cursor: 'pointer' }}
            >
              Virtual Classroom
            </button>
          </div>
        </Html>
      )}
    </>
  );
};

export default Character;
