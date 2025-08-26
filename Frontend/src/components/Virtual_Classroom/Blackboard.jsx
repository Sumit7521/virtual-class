// Blackboard.jsx
import { useEffect, useRef, useState } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';
import { useVirtualClassroom } from '../../contexts/VirtualClassroomContext';

const Blackboard = () => {
  const { nodes } = useGLTF('/models/Classroom.glb');
  const [videoTexture, setVideoTexture] = useState(null);
  const planeRef = useRef();
  
  const {
    localStream,
    pinnedStream,
    pinnedParticipant,
    leaveMeeting,
    handleMuteToggle,
    handleCameraToggle,
    handleScreenShare,
    isMuted,
    cameraOn,
    isScreenSharing
  } = useVirtualClassroom();

  // Leva-controlled position, scale, and color
  const { posX, posY, posZ, scaleX, scaleY, buttonColor } = useControls('Button Controls', {
    posX: { value: 0, min: -2, max: 2, step: 0.01 },
    posY: { value: -1, min: -1, max: 1, step: 0.01 },
    posZ: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
    scaleX: { value: 1.3, min: 0.5, max: 2, step: 0.01 },
    scaleY: { value: 1, min: 0.5, max: 2, step: 0.01 },
    buttonColor: { value: '#22222d' },
  });

  // Create video texture from the stream to display on blackboard
  useEffect(() => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    // Determine which stream to use - pinned stream takes priority
    const streamToUse = pinnedStream || localStream;
    
    if (streamToUse) {
      video.srcObject = streamToUse;
      video.play();

      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBFormat;
      texture.colorSpace = THREE.SRGBColorSpace;

      setVideoTexture(texture);
      
      // Cleanup function
      return () => {
        video.pause();
        video.srcObject = null;
        texture.dispose();
      };
    }
  }, [localStream, pinnedStream]);

  if (!nodes?.Blackboard || !videoTexture) return null;

  const blackboard = nodes.Blackboard.clone();
  const box = new THREE.Box3().setFromObject(blackboard);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  return (
    <mesh
      ref={planeRef}
      position={[center.x + 0.75, center.y + 8.08, center.z - 14.29]}
      scale={[5, 5.07, 1.5]}
    >
      <planeGeometry args={[size.x, size.y]} />
      <meshBasicMaterial 
        map={videoTexture} 
        toneMapped={false} 
        transparent 
        // Mirror local video but not pinned video
        {...(pinnedStream ? {} : { map: videoTexture })}
      />

      {/* Video title overlay when pinned participant is showing */}
      {pinnedParticipant && (
        <Html
          position={[0, 0.8, 0.1]}
          transform
          center
          distanceFactor={1.5}
        >
          <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-center">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">📌</span>
              <span className="font-semibold">{pinnedParticipant.name}</span>
            </div>
          </div>
        </Html>
      )}

      <Html
        position={[posX, posY, posZ]}
        transform
        center
        scale={[scaleX, scaleY, 1]}
        distanceFactor={1.5}
      >
        <div style={buttonContainerStyle}>
          <IconButton
            iconClass="ri-logout-box-r-line"
            onClick={leaveMeeting}
            title="Leave Room"
            color={buttonColor}
          />
          <IconButton
            iconClass={isMuted ? "ri-mic-off-fill" : "ri-mic-fill"}
            onClick={() => handleMuteToggle(!isMuted)}
            title={isMuted ? "Unmute" : "Mute"}
            color={isMuted ? '#ef4444' : buttonColor}
          />
          <IconButton
            iconClass={cameraOn ? "ri-video-on-line" : "ri-video-off-line"}
            onClick={() => handleCameraToggle(!cameraOn)}
            title={cameraOn ? "Camera Off" : "Camera On"}
            color={!cameraOn ? '#ef4444' : buttonColor}
          />
          <IconButton
            iconClass={isScreenSharing ? "ri-stop-circle-line" : "ri-tv-2-line"}
            onClick={handleScreenShare}
            title={isScreenSharing ? "Stop Screen Share" : "Screen Share"}
            color={isScreenSharing ? '#10b981' : buttonColor}
          />
        </div>
      </Html>
    </mesh>
  );
};

const buttonContainerStyle = {
  display: 'flex',
  gap: '20px',
  pointerEvents: 'auto',
  background: 'rgba(0,0,0,0.3)',
  padding: '10px 16px',
  borderRadius: '14px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
};

const IconButton = ({ iconClass, onClick, title, color }) => (
  <i
    className={`ri ${iconClass}`}
    onClick={onClick}
    title={title}
    style={{
      fontSize: '36px',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      padding: '6px',
      borderRadius: '50%',
      background: color,
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.3)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    }}
  />
);

export default Blackboard;