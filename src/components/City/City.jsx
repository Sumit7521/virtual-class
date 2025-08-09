import React from 'react'
import { useGLTF } from '@react-three/drei'

export default function City(props) {
  const { scene } = useGLTF('/models/City.glb')
  return <primitive object={scene} {...props} dispose={null} />
}
