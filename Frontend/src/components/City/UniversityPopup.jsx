// components/Character/UniversityPopup.jsx
import { Html } from '@react-three/drei'

const UniversityPopup = ({ position, show, onNavigate, charRef }) => {
  return (
    <Html
      position={[position.x, position.y, position.z]}
      transform
      distanceFactor={1}
      sprite={false}
      occlude={[charRef]}
    >
      <div
        className={`transition-opacity duration-500 ease-in-out 
          ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="bg-white/20 backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col items-center w-[80vw] max-w-[700px] h-[70vh] max-h-[600px] gap-4 text-white">
          
          {/* University Logo */}
          <img 
            src="./image/techno full logo.png" 
            alt="Techno India" 
            className="w-[90%] h-[25%] object-cover rounded-xl mt-3 mb-2" 
          />
          
          {/* Welcome Text */}
          <div className="w-[90%] flex flex-col gap-2 items-center text-center">
            <h2 className="text-[4vw] md:text-[3vw] font-bold mb-2">
              Welcome to Techno India University!
            </h2>
            <p className='text-[2vw] md:text-[2vw] mb-3'>
              Where do you want to go?
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-[2%] h-[40%] w-[90%]">
            <button
              onClick={() => onNavigate('/ai-classroom')} 
              className="h-[100%] font-semibold text-[2vw] md:text-[1.5vw] flex-1 bg-red-500 hover:bg-red-600 rounded-md text-white cursor-pointer transition-colors"
            >
              AI Classroom
            </button>
            <button
              onClick={() => onNavigate('/virtual-classroom')} 
              className="h-[100%] font-semibold text-[2vw] md:text-[1.5vw] flex-1 bg-red-500 hover:bg-red-600 rounded-md text-white cursor-pointer transition-colors"
            >
              Virtual Classroom
            </button>
          </div>
        </div>
      </div>
    </Html>
  )
}

export default UniversityPopup