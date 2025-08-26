// contexts/VirtualClassroomContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Backend URL configuration
const BACKEND_URL = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && window.env?.REACT_APP_BACKEND_URL) {
    return window.env.REACT_APP_BACKEND_URL;
  }
  if (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production') {
    return 'https://immersio.onrender.com';
  }
  return 'http://localhost:3000';
})();

const SOCKET_URL = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  return BACKEND_URL;
})();

const VirtualClassroomContext = createContext();

export const useVirtualClassroom = () => {
  const context = useContext(VirtualClassroomContext);
  if (!context) {
    throw new Error('useVirtualClassroom must be used within a VirtualClassroomProvider');
  }
  return context;
};

export const VirtualClassroomProvider = ({ children }) => {
  // Socket and connection state
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef(null);

  // User and room state
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [meetingIdInput, setMeetingIdInput] = useState('');

  // UI state
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  const [showMeetingEntry, setShowMeetingEntry] = useState(true);

  // Media state
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Participants and peers
  const [participants, setParticipants] = useState([]);
  const [peers, setPeers] = useState({});
  const peersRef = useRef({});

  // Chat
  const [chatMessages, setChatMessages] = useState([]);

  // Ping feature state
  const [pinnedParticipant, setPinnedParticipant] = useState(null);
  const [pinnedStream, setPinnedStream] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    console.log('Connecting to backend:', SOCKET_URL);
    console.log('Environment:', typeof import.meta !== 'undefined' ? import.meta.env.MODE : 'production');
    
    const initializeSocket = () => {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 30000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: maxReconnectAttempts
      });

      newSocket.on('connect', () => {
        console.log('Successfully connected to backend server');
        setConnectionStatus('connected');
        setReconnectAttempts(0);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnectionStatus('error');
        
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Retrying connection in ${delay}ms... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            newSocket.connect();
          }, delay);
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        setConnectionStatus('disconnected');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        setConnectionStatus('connected');
        setReconnectAttempts(0);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Reconnection failed:', error);
        setConnectionStatus('error');
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Failed to reconnect after maximum attempts');
        setConnectionStatus('error');
      });

      setSocket(newSocket);
      return newSocket;
    };

    const socketInstance = initializeSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketInstance.close();
    };
  }, [reconnectAttempts]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleUserConnected = async (userId) => {
      console.log('User connected:', userId);
      if (!localStream) {
        console.log('No local stream available yet');
        return;
      }

      const peerConnection = createPeerConnection(userId);
      
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('signal', { target: userId, signal: peerConnection.localDescription });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    };

    const handleSignal = async (data) => {
      const { signal, from } = data;

      if (!peersRef.current[from]) {
        createPeerConnection(from);
      }

      const peerConnection = peersRef.current[from];

      try {
        if (signal.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal));
        } else if (signal.type === 'offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('signal', { target: from, signal: peerConnection.localDescription });
        } else if (signal.type === 'answer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    };

    const handleUserDisconnected = (userId) => {
      console.log('User disconnected:', userId);
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setPeers(prevPeers => {
        const newPeers = { ...prevPeers };
        delete newPeers[userId];
        return newPeers;
      });
      
      // Clear pinned participant if they disconnected
      if (pinnedParticipant?.id === userId) {
        setPinnedParticipant(null);
        setPinnedStream(null);
      }
    };

    const handleChatReceived = (data) => {
      const { message, username } = data;
      setChatMessages(prev => [...prev, { username, message, isOwn: false }]);
    };

    const handleRoomError = (error) => {
      console.error('Room error:', error);
      alert(`Room error: ${error.message || 'Unknown error occurred'}`);
    };

    socket.on('user-connected', handleUserConnected);
    socket.on('signal', handleSignal);
    socket.on('user-disconnected', handleUserDisconnected);
    socket.on('chat', handleChatReceived);
    socket.on('room-error', handleRoomError);

    return () => {
      socket.off('user-connected');
      socket.off('signal');
      socket.off('user-disconnected');
      socket.off('chat');
      socket.off('room-error');
    };
  }, [socket, localStream, pinnedParticipant]);

  const createPeerConnection = (userId) => {
    console.log('Creating peer connection for:', userId);
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
    });

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
        console.log('Added local track:', track.kind);
      });
    }

    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from user:', userId);
      const [remoteStream] = event.streams;
      setPeers(prevPeers => ({
        ...prevPeers,
        [userId]: { ...prevPeers[userId], stream: remoteStream }
      }));
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', { target: userId, signal: event.candidate });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${userId}:`, peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        console.log('Peer connection failed, attempting to reconnect...');
      }
    };

    peersRef.current[userId] = peerConnection;
    setPeers(prevPeers => ({
      ...prevPeers,
      [userId]: { connection: peerConnection, stream: null }
    }));

    return peerConnection;
  };

  // Update participants list
  useEffect(() => {
    const participantList = [
      { 
        id: 'local', 
        name: `${username} (You)`, 
        stream: localStream, 
        isLocal: true 
      }
    ];
    
    Object.entries(peers).forEach(([userId, peer]) => {
      if (peer.stream) {
        participantList.push({
          id: userId,
          name: `User ${userId.substring(0, 8)}`,
          stream: peer.stream,
          isLocal: false
        });
      }
    });
    
    setParticipants(participantList);
  }, [peers, localStream, username]);

  // Utility functions
  const getStatusColor = () => {
    switch(connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'disconnected': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch(connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return reconnectAttempts > 0 ? `Retrying... (${reconnectAttempts}/${maxReconnectAttempts})` : 'Connection Error';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  // Meeting functions
  const startMeeting = async (meetingId = roomId) => {
    const idToUse = meetingId || roomId;
    if (!idToUse.trim()) {
      alert('Please enter a valid Meeting ID.');
      return false;
    }

    try {
      console.log('Starting meeting with room ID:', idToUse);
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, max: 1920 }, 
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (highQualityError) {
        console.log('High quality video failed, trying lower quality:', highQualityError);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640, max: 1280 }, 
            height: { ideal: 480, max: 720 } 
          }, 
          audio: true 
        });
      }
      
      setLocalStream(stream);

      if (socket && socket.connected) {
        socket.emit('join-room', idToUse);
        setShowMeetingEntry(false);
        console.log('Joined room:', idToUse);
        return true;
      } else {
        throw new Error('Socket not connected');
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      let errorMessage = 'Error accessing camera/microphone. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera or microphone is already in use.';
      } else if (error.message === 'Socket not connected') {
        errorMessage = 'Not connected to server. Please check your internet connection.';
      } else {
        errorMessage += 'Please check your device settings and try again.';
      }
      
      alert(errorMessage);
      return false;
    }
  };

  const createMeeting = async () => {
    const newRoomId = 'meet-' + Math.random().toString(36).substring(2, 9);
    setRoomId(newRoomId);
    setMeetingIdInput(newRoomId);
    setIsHost(true);
    console.log('Created meeting with ID:', newRoomId);
    
    const result = await startMeeting(newRoomId);
    if (!result) {
      alert('Failed to start the meeting. Please try again.');
    }
  };

  const joinMeeting = async () => {
    const trimmedId = meetingIdInput.trim();
    if (!trimmedId) {
      alert('Please enter a valid Meeting ID.');
      return;
    }

    try {
      const checkUrl = `${BACKEND_URL}/api/meet/check-room/${trimmedId}`;
      console.log(`Checking room existence at: ${checkUrl}`);
      
      const response = await fetch(checkUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Room check response:', data);
      
      if (!data.exists) {
        alert('Room ID does not exist. Please check the Meeting ID or create a new meeting.');
        return;
      }
      
      setIsHost(false);
      const result = await startMeeting(trimmedId);
      if (result) {
        console.log('Successfully joined the meeting');
        setRoomId(trimmedId);
      } else {
        alert('Failed to join the meeting. Please try again.');
      }
    } catch (error) {
      console.error('Error checking room existence:', error);
      
      if (error.name === 'AbortError') {
        alert('Request timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('CORS')) {
        alert(`Cannot connect to the server. Please check your internet connection and try again.`);
      } else {
        alert(`Error: ${error.message}. Please try again.`);
      }
    }
  };

  const leaveMeeting = () => {
    if (socket && socket.connected) {
      socket.emit('leave-room');
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peersRef.current).forEach(peer => {
      if (peer && peer.close) {
        peer.close();
      }
    });
    
    setLocalStream(null);
    setPeers({});
    peersRef.current = {};
    setChatMessages([]);
    setParticipants([]);
    setShowMeetingEntry(true);
    setMeetingIdInput('');
    setRoomId('');
    setIsHost(false);
    setIsMuted(false);
    setCameraOn(true);
    setIsScreenSharing(false);
    setPinnedParticipant(null);
    setPinnedStream(null);
    console.log('Left the meeting and cleared resources.');
  };

  // Media control functions
  const handleMuteToggle = (muted) => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !muted;
      });
      setIsMuted(muted);
      
      if (socket && socket.connected) {
        socket.emit('mute-state', { muted });
      }
    }
  };

  const handleCameraToggle = (cameraOn) => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = cameraOn;
      });
      setCameraOn(cameraOn);
      
      if (socket && socket.connected) {
        socket.emit('camera-state', { cameraOn });
      }
    }
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen share and switch back to camera
        localStream.getTracks().forEach(track => track.stop());
        
        const cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280, max: 1920 }, 
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        setLocalStream(cameraStream);
        setIsScreenSharing(false);
        
        // Update all peer connections with new stream
        Object.entries(peersRef.current).forEach(([userId, peerConnection]) => {
          if (peerConnection) {
            const sender = peerConnection.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender) {
              peerConnection.removeTrack(sender);
            }
            
            const videoTrack = cameraStream.getVideoTracks()[0];
            if (videoTrack) {
              peerConnection.addTrack(videoTrack, cameraStream);
            }
          }
        });
        
        console.log('Switched back to camera');
        return;
      }
      
      // Start screen sharing
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "window"
        },
        audio: false
      });
      
      let audioTrack = null;
      if (localStream) {
        audioTrack = localStream.getAudioTracks()[0];
        localStream.getTracks().forEach(track => track.stop());
      }
      
      const newStream = new MediaStream();
      screenStream.getVideoTracks().forEach(track => newStream.addTrack(track));
      if (audioTrack) {
        newStream.addTrack(audioTrack);
      }
      
      setLocalStream(newStream);
      setIsScreenSharing(true);
      
      // Update all peer connections with new stream
      Object.entries(peersRef.current).forEach(([userId, peerConnection]) => {
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            peerConnection.removeTrack(sender);
          }
          
          const videoTrack = newStream.getVideoTracks()[0];
          if (videoTrack) {
            peerConnection.addTrack(videoTrack, newStream);
          }
        }
      });
      
      // Handle screen share ending
      screenStream.getVideoTracks()[0].onended = () => {
        handleScreenShare();
      };
      
      console.log('Screen sharing started');
      
    } catch (error) {
      console.error('Error with screen sharing:', error);
      alert('Failed to start screen sharing. Please check your browser permissions.');
    }
  };

  // Chat function
  const sendMessage = (message) => {
    if (message.trim() !== '' && socket && socket.connected) {
      setChatMessages(prev => [...prev, { username: 'You', message: message, isOwn: true }]);
      socket.emit('chat', { message: message, username });
    } else if (!socket || !socket.connected) {
      alert('Not connected to server. Please check your connection.');
    }
  };

  // Ping feature functions
  const pinParticipant = (participant) => {
    if (participant.id === 'local') {
      // Don't pin local participant
      return;
    }
    
    console.log('Pinning participant:', participant.name);
    setPinnedParticipant(participant);
    setPinnedStream(participant.stream);
  };

  const unpinParticipant = () => {
    console.log('Unpinning participant');
    setPinnedParticipant(null);
    setPinnedStream(null);
  };

  // Username modal function
  const submitUsername = () => {
    if (username.trim()) {
      setShowUsernameModal(false);
    } else {
      alert("Username is required to join the meeting.");
    }
  };

  const contextValue = {
    // Connection state
    socket,
    connectionStatus,
    getStatusColor,
    getStatusText,
    
    // User and room state
    username,
    setUsername,
    roomId,
    setRoomId,
    isHost,
    meetingIdInput,
    setMeetingIdInput,
    
    // UI state
    showUsernameModal,
    showMeetingEntry,
    submitUsername,
    
    // Media state
    localStream,
    isMuted,
    cameraOn,
    isScreenSharing,
    
    // Participants and chat
    participants,
    chatMessages,
    
    // Ping feature
    pinnedParticipant,
    pinnedStream,
    pinParticipant,
    unpinParticipant,
    
    // Meeting functions
    createMeeting,
    joinMeeting,
    startMeeting,
    leaveMeeting,
    
    // Media controls
    handleMuteToggle,
    handleCameraToggle,
    handleScreenShare,
    
    // Chat
    sendMessage,
    
    // Backend URL for reference
    BACKEND_URL
  };

  return (
    <VirtualClassroomContext.Provider value={contextValue}>
      {children}
    </VirtualClassroomContext.Provider>
  );
};