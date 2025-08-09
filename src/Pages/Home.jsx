import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Viverse, FixedBvhPhysicsBody } from '@react-three/viverse'
import City from '../components/City/City'
import Character from '../components/City/Charecter'

export default function Home() {
  return (
    <div className='w-screen h-screen'>
      <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
        <Viverse>
          <Sky />
          <ambientLight intensity={1} />
          <directionalLight intensity={1.2} position={[5, 10, 10]} castShadow />
          <Character />
          <FixedBvhPhysicsBody>
            <City />
          </FixedBvhPhysicsBody>
        </Viverse>
      </Canvas>
    </div>
  )
}
