// Home.jsx - Updated with Aerial Minimap
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Viverse, FixedBvhPhysicsBody } from '@react-three/viverse'
import { useState, useRef } from 'react'
import City from '../components/City/City'
import Character from '../components/City/Charecter'
import Spotify from '../components/City/Spotify'
import AerialMinimap from '../components/City/AerialMinimap'

export default function Home() {
  const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0, z: 0 })
  const characterRef = useRef()
  const cityRef = useRef()
  const [cityScene, setCityScene] = useState(null)

  // Callback to capture the city scene for the minimap
  const handleCityLoad = (scene) => {
    setCityScene(scene)
  }

  return (
    <div className='w-screen h-screen relative'>
      {/* Main 3D Scene */}
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
        <Viverse>
          <Sky />
          <ambientLight intensity={1} />
          <directionalLight intensity={1.2} position={[5, 10, 10]} castShadow />
          
          <Character 
            ref={characterRef}
            onPositionChange={setCharacterPosition}
          />
          
          <FixedBvhPhysicsBody>
            <City 
              ref={cityRef}
              onSceneLoad={handleCityLoad}
            />
          </FixedBvhPhysicsBody>
        </Viverse>
      </Canvas>

      {/* UI Overlays */}
      <AerialMinimap 
        characterPosition={characterPosition}
        cityScene={cityScene}
        characterRef={characterRef}
      />
      <Spotify />
    </div>
  )
}