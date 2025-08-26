// virtualclassroom.jsx
import React from 'react';
import { VirtualClassroomProvider, useVirtualClassroom } from '../contexts/VirtualClassroomContext';
import Scene from '../components/Virtual_Classroom/Scene';

const VirtualClassroomContent = () => {
  const {
    showUsernameModal,
    showMeetingEntry,
    username,
    setUsername,
    submitUsername,
    roomId,
    isHost,
    meetingIdInput,
    setMeetingIdInput,
    createMeeting,
    joinMeeting,
    connectionStatus,
    getStatusColor,
    getStatusText,
    BACKEND_URL
  } = useVirtualClassroom();

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
      <Scene />
    </div>
  );
};

const Virtualclassroom = () => {
  return (
    <VirtualClassroomProvider>
      <VirtualClassroomContent />
    </VirtualClassroomProvider>
  );
};

export default Virtualclassroom;