// components/UI/OptimizedMinimap.jsx
import { useRef, useEffect, useState, useCallback } from 'react'

const OptimizedMinimap = ({ characterPosition, onNavigateToLocation }) => {
  const canvasRef = useRef()
  const [selectedPOI, setSelectedPOI] = useState(null)
  const [pathToPOI, setPathToPOI] = useState(null)

  // Reduced map size
  const mapSize = 200
  const cityBounds = { minX: -150, maxX: 150, minZ: -150, maxZ: 150 }

  // Only one POI: University
  const pois = [
    { id: 'university', name: 'University Gate', x: 98, z: -6.9, color: '#4f46e5', icon: '🏫' }
  ]

  const worldToMap = useCallback((worldX, worldZ) => {
    const mapX = ((worldX - cityBounds.minX) / (cityBounds.maxX - cityBounds.minX)) * (mapSize - 40) + 20
    const mapZ = ((worldZ - cityBounds.minZ) / (cityBounds.maxZ - cityBounds.minZ)) * (mapSize - 40) + 20
    return { x: mapX, y: mapSize - mapZ }
  }, [])

  const calculateDistance = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.z - p2.z) ** 2)

  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width = mapSize * dpr
    canvas.height = mapSize * dpr
    canvas.style.width = `${mapSize}px`
    canvas.style.height = `${mapSize}px`
    ctx.scale(dpr, dpr)

    // Glassy background
    ctx.clearRect(0, 0, mapSize, mapSize)
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(0, 0, mapSize, mapSize)

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, mapSize - 40, mapSize - 40)

    // Draw path if selected
    if (selectedPOI && characterPosition && pathToPOI) {
      const charMap = worldToMap(characterPosition.x, characterPosition.z)
      const poiMap = worldToMap(selectedPOI.x, selectedPOI.z)
      ctx.setLineDash([10, 10])
      ctx.lineDashOffset = -(Date.now() / 50) % 20
      ctx.strokeStyle = selectedPOI.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(charMap.x, charMap.y)
      ctx.lineTo(poiMap.x, poiMap.y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw University POI
    pois.forEach(poi => {
      const pos = worldToMap(poi.x, poi.z)
      const isSelected = selectedPOI?.id === poi.id
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, isSelected ? 16 : 12, 0, 2 * Math.PI)
      ctx.fillStyle = poi.color
      ctx.fill()
      if (isSelected) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      ctx.font = `${isSelected ? 20 : 16}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText(poi.icon, pos.x, pos.y + (isSelected ? 7 : 5))
    })

    // Draw character position
    if (characterPosition) {
      const charPos = worldToMap(characterPosition.x, characterPosition.z)
      const glow = ctx.createRadialGradient(charPos.x, charPos.y, 0, charPos.x, charPos.y, 15)
      glow.addColorStop(0, 'rgba(0,255,100,0.8)')
      glow.addColorStop(1, 'rgba(0,255,100,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(charPos.x, charPos.y, 15, 0, 2 * Math.PI)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(charPos.x, charPos.y, 8, 0, 2 * Math.PI)
      ctx.fillStyle = '#00ff6a'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }, [characterPosition, selectedPOI, pathToPOI, worldToMap])

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let clickedPOI = null
    pois.forEach(poi => {
      const pos = worldToMap(poi.x, poi.z)
      if (Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2) <= 16) {
        clickedPOI = poi
      }
    })

    if (clickedPOI) {
      setSelectedPOI(clickedPOI)
      if (characterPosition) {
        const distance = calculateDistance(characterPosition, clickedPOI)
        setPathToPOI({ target: clickedPOI, distance })
        if (onNavigateToLocation) onNavigateToLocation(clickedPOI)
      }
    }
  }

  useEffect(() => {
    if (selectedPOI && characterPosition && pathToPOI) {
      const newDistance = calculateDistance(characterPosition, selectedPOI)
      setPathToPOI(prev => ({ ...prev, distance: newDistance }))
      if (newDistance < 10) {
        setSelectedPOI(null)
        setPathToPOI(null)
      }
    }
  }, [characterPosition, selectedPOI, pathToPOI])

  useEffect(() => {
    const interval = setInterval(drawMinimap, 16)
    return () => clearInterval(interval)
  }, [drawMinimap])

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-3 border border-white/20 shadow-lg">
        <h3 className="text-white text-sm font-semibold mb-2">🗺️ City Map</h3>
        <canvas
          ref={canvasRef}
          width={mapSize}
          height={mapSize}
          className="border border-white/20 rounded-xl cursor-pointer"
          onClick={handleClick}
        />
        {selectedPOI && pathToPOI && (
          <div className="mt-3 bg-white/10 rounded-lg p-2 text-white text-xs">
            {selectedPOI.icon} {selectedPOI.name} – {pathToPOI.distance.toFixed(1)}m
          </div>
        )}
      </div>
    </div>
  )
}

export default OptimizedMinimap
