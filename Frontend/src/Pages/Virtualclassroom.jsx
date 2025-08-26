// virtualclassroom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Scene from '../components/Virtual_Classroom/Scene';

// Backend URL - properly handle environment variables for deployment
const BACKEND_URL = (() => {
  // For Vite (current setup)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // For runtime environment variables (if injected at runtime)
  if (typeof window !== 'undefined' && window.env?.REACT_APP_BACKEND_URL) {
    return window.env.REACT_APP_BACKEND_URL;
  }
  
  // For Create React App (if needed)
  if (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Production fallback
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production') {
    return 'https://immersio.onrender.com';
  }
  
  // Development fallback
  return 'http://localhost:3000';
})();

const SOCKET_URL = (() => {
  // For Vite
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Fallback to BACKEND_URL
  return BACKEND_URL;
})();

const Virtualclassroom = () => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [showMeetingEntry, setShowMeetingEntry] = useState(true);
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [chatMessages, setChatMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  const peersRef = useRef({});
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Initialize socket connection with better error handling and reconnection
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
        
        // Try to reconnect with exponential backoff
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
      updateParticipants();
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
  }, [socket, localStream]);

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
      updateParticipants();
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
        // Handle peer connection failure
      }
    };

    peersRef.current[userId] = peerConnection;
    setPeers(prevPeers => ({
      ...prevPeers,
      [userId]: { connection: peerConnection, stream: null }
    }));

    return peerConnection;
  };

  const updateParticipants = () => {
    const participantList = [
      { id: 'local', name: `${username} (You)`, stream: localStream, isLocal: true }
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
  };

  useEffect(() => {
    updateParticipants();
  }, [peers, localStream, username]);

  const startMeeting = async (meetingId = roomId) => {
    const idToUse = meetingId || roomId;
    if (!idToUse.trim()) {
      alert('Please enter a valid Meeting ID.');
      return false;
    }

    try {
      console.log('Starting meeting with room ID:', idToUse);
      
      // Request media with fallback options for mobile compatibility
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
        // Fallback to lower quality
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
        // Add timeout for production
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

  const sendMessage = (message) => {
    if (message.trim() !== '' && socket && socket.connected) {
      setChatMessages(prev => [...prev, { username: 'You', message: message, isOwn: true }]);
      socket.emit('chat', { message: message, username });
    } else if (!socket || !socket.connected) {
      alert('Not connected to server. Please check your connection.');
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
    console.log('Left the meeting and cleared resources.');
  };

  const submitUsername = () => {
    if (username.trim()) {
      setShowUsernameModal(false);
    } else {
      alert("Username is required to join the meeting.");
    }
  };

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

  // Username Modal
  if (showUsernameModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">VC</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Welcome to Virtual Classroom</h2>
            <p className="text-slate-400 mb-6">Please enter your name to continue.</p>
            
            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-4">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span>Server: {getStatusText()}</span>
            </div>
            
            {/* Environment info in development */}
            {(typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') && (
              <div className="text-xs text-slate-500 mb-4">
                <div>Backend: {BACKEND_URL}</div>
                <div>Socket: {SOCKET_URL}</div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyPress={(e) => e.key === 'Enter' && submitUsername()}
              maxLength={50}
            />
            <button
              onClick={submitUsername}
              disabled={connectionStatus !== 'connected' || !username.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none"
            >
              {connectionStatus === 'connected' ? 'Continue' : getStatusText()}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Meeting Entry Modal
  if (showMeetingEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Welcome, {username}!</h2>
            <p className="text-slate-400 mb-6">Start or join a virtual classroom meeting.</p>
            
            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-4">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span>Server: {getStatusText()}</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={createMeeting}
                disabled={connectionStatus !== 'connected'}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg disabled:transform-none"
              >
                <svg className="h-5 w-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                Create New Meeting (Host)
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={meetingIdInput}
                onChange={(e) => setMeetingIdInput(e.target.value)}
                placeholder="Enter Meeting ID to Join"
                className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                onKeyPress={(e) => e.key === 'Enter' && joinMeeting()}
                maxLength={20}
              />
              <button
                onClick={joinMeeting}
                disabled={connectionStatus !== 'connected' || !meetingIdInput.trim()}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg disabled:transform-none"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <span className="ml-2">Join Meeting</span>
              </button>
            </div>
            {isHost && roomId && (
              <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">Meeting ID:</p>
                <p className="text-slate-100 font-mono text-lg bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent font-bold mb-4 break-all">{roomId}</p>
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Meeting ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Virtual Classroom Scene
  return (
    <div className='h-screen w-screen relative'>
      <Scene 
        participants={participants}
        chatMessages={chatMessages}
        onSendMessage={sendMessage}
        onLeaveMeeting={leaveMeeting}
        localStream={localStream}
        username={username}
        roomId={roomId}
      />
    </div>
  );
};

export default Virtualclassroom;