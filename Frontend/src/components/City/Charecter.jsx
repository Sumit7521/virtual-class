// components/Character/Character.jsx
import { SimpleCharacter } from '@react-three/viverse'
import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import UniversityPopup from './UniversityPopup'

const Character = forwardRef(({ onPositionChange }, ref) => {
  const charRef = useRef()
  const [showPopup, setShowPopup] = useState(false)
  const navigate = useNavigate()

  // Expose character reference to parent
  useImperativeHandle(ref, () => charRef.current)

  // Trigger location (University gate)
  const triggerPos = { x: 98, y: -1.5, z: -6.9 }
  const triggerDistance = 5

  useFrame(() => {
    if (!charRef.current) return
    
    const pos = charRef.current.position
    
    // Update parent with position for minimap
    if (onPositionChange) {
      onPositionChange({ x: pos.x, y: pos.y, z: pos.z })
    }
    
    // Check proximity to trigger location
    const dist = Math.sqrt(
      (pos.x - triggerPos.x) ** 2 +
      (pos.y - triggerPos.y) ** 2 +
      (pos.z - triggerPos.z) ** 2
    )
    setShowPopup(dist < triggerDistance)
  })

  return (
    <>
      <SimpleCharacter ref={charRef} />
      
      <UniversityPopup 
        position={triggerPos}
        show={showPopup}
        onNavigate={navigate}
        charRef={charRef}
      />
    </>
  )
})

Character.displayName = 'Character'

export default Character