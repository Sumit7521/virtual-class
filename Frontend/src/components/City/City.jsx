// components/City/City.jsx - Updated with scene export
import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { useGLTF } from '@react-three/drei'
import { useLoader, useThree } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { useControls } from 'leva'
import * as THREE from 'three'

const City = forwardRef(({ onSceneLoad, ...props }, ref) => {
  const { scene } = useGLTF('/models/City.glb')
  const hdri = useLoader(RGBELoader, '/hdri/venice_dawn_1_1k.hdr')
  const { scene: threeScene, gl } = useThree()

  // Expose city scene to parent
  useImperativeHandle(ref, () => scene)

  // Leva controls for environment settings
  const { exposure, backgroundIntensity } = useControls('Environment Settings', {
    exposure: { value: 0.46, min: 0, max: 3, step: 0.01 },
    backgroundIntensity: { value: 1, min: 0, max: 2, step: 0.1 }
  })

  // Setup HDRI environment
  useEffect(() => {
    if (!hdri || !threeScene) return
    
    hdri.mapping = THREE.EquirectangularReflectionMapping
    threeScene.background = hdri
    threeScene.environment = hdri
    
    console.log("City environment loaded ✅", hdri)
    
    return () => {
      // Cleanup if needed
      if (threeScene.background === hdri) {
        threeScene.background = null
      }
      if (threeScene.environment === hdri) {
        threeScene.environment = null
      }
    }
  }, [hdri, threeScene])

  // Apply exposure changes
  useEffect(() => {
    if (gl) {
      gl.toneMappingExposure = exposure
    }
  }, [exposure, gl])

  // Apply background intensity changes
  useEffect(() => {
    if (hdri && threeScene.background) {
      threeScene.backgroundIntensity = backgroundIntensity
    }
  }, [backgroundIntensity, hdri, threeScene])

  // Optimize city model and export scene on load
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Enable shadows for city meshes
          child.castShadow = true
          child.receiveShadow = true
          
          // Optimize materials
          if (child.material) {
            child.material.needsUpdate = true
          }
        }
      })

      // Export scene to parent for minimap
      if (onSceneLoad) {
        onSceneLoad(scene)
      }
    }
  }, [scene, onSceneLoad])

  return (
    <group {...props}>
      <primitive object={scene} dispose={null} />
    </group>
  )
})

City.displayName = 'City'

// Preload the city model
useGLTF.preload('/models/City.glb')

export default City