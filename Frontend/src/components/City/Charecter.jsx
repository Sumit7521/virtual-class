import { SimpleCharacter } from '@react-three/viverse'; 
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useNavigate } from 'react-router-dom'; 

const Character = () => {
  const charRef = useRef();
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate(); 

  // Trigger location (University gate)
  const triggerPos = { x: 98, y: -1.5, z: -6.9 };
  const triggerDistance = 5;

  useFrame(() => {
    if (!charRef.current) return;
    const pos = charRef.current.position;
    const dist = Math.sqrt(
      (pos.x - triggerPos.x) ** 2 +
      (pos.y - triggerPos.y) ** 2 +
      (pos.z - triggerPos.z) ** 2
    );
    setShowPopup(dist < triggerDistance);
  });

  return (
    <>
      <SimpleCharacter ref={charRef} />

      <Html
        position={[triggerPos.x, triggerPos.y, triggerPos.z]}
        transform
        distanceFactor={1}
        sprite={false}
        occlude={[charRef]} 
      >
        <div
          className={`transition-opacity duration-500 ease-in-out 
            ${showPopup ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="bg-white/20 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col items-center w-[80vw] max-w-[700px] h-[70vh] max-h-[600px] gap-4 text-white">
            
            {/* Top Image */}
            <img 
              src="./image/techno full logo.png" 
              alt="Techno India" 
              className="w-[90%] h-[25%] object-cover rounded-xl mt-3 mb-2" 
            />
            
            {/* Text */}
            <div className="w-[90%] flex flex-col gap-2 items-center text-center">
              <h2 className="text-[4vw] md:text-[3vw] font-bold mb-2">Welcome to Techno India University!</h2>
              <p className='text-[2vw] md:text-[2vw] mb-3'>Where do you want to go?</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-[2%] h-[40%] w-[90%]">
              <button
                onClick={() => navigate('/ai-classroom')} 
                className="h-[100%] font-semibold text-[2vw] md:text-[1.5vw] flex-1 bg-red-500 rounded-md text-white cursor-pointer"
              >
                AI Classroom
              </button>
              <button
                onClick={() => navigate('/virtual-classroom')} 
                className="h-[100%] font-semibold text-[2vw] md:text-[1.5vw] flex-1 bg-red-500 rounded-md text-white cursor-pointer"
              >
                Virtual Classroom
              </button>
            </div>
          </div>
        </div>
      </Html>
    </>
  );
};

export default Character;