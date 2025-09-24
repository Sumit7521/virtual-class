# Immersio - Virtual Campus Platform

A comprehensive virtual campus platform that combines AI-powered classroom experiences with real-time video conferencing in immersive 3D environments. Built with React, Three.js, Node.js, and WebRTC technologies.

## 🎯 Project Overview

Immersio is a cutting-edge virtual campus platform that provides:
- **AI Classroom**: Interactive 3D environment with an AI instructor (Rahul Sir) for Python learning
- **Virtual Classroom**: Real-time video conferencing in a 3D classroom environment
- **3D Environments**: Multiple immersive virtual spaces for different learning experiences

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Server**: Express.js with Socket.IO for real-time communication
- **AI Integration**: Google Gemini AI for intelligent responses
- **TTS**: ElevenLabs for text-to-speech conversion
- **WebRTC**: Peer-to-peer video communication

### Frontend (React + Three.js)
- **3D Rendering**: React Three Fiber for 3D scenes
- **UI Framework**: Tailwind CSS for styling
- **State Management**: React Context for global state
- **Routing**: React Router for navigation

## 📁 Project Structure

```
Immersio/
├── Backend/                    # Node.js backend server
│   ├── config/                 # Configuration files
│   │   └── corsConfig.js       # CORS configuration
│   ├── controllers/            # Route controllers
│   │   ├── aiController.js     # AI chat endpoints
│   │   └── meetController.js   # Meeting management
│   ├── middlewares/           # Express middlewares
│   │   └── errorHandler.js     # Error handling middleware
│   ├── routes/                 # API routes
│   │   ├── ai.js              # AI chat routes
│   │   └── meet.js            # Meeting routes
│   ├── services/              # Business logic services
│   │   ├── geminiService.js    # Google Gemini AI service
│   │   └── ttsService.js       # Text-to-speech service
│   ├── sockets/               # Socket.IO configuration
│   │   └── socketInit.js       # Socket.IO setup and handlers
│   ├── utils/                 # Utility functions
│   │   └── helpers.js          # Helper functions
│   ├── server.js              # Main server file
│   └── package.json           # Backend dependencies
├── Frontend/                   # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Ai_classroom/   # AI classroom components
│   │   │   │   └── Scene.jsx   # AI classroom 3D scene
│   │   │   ├── City/          # City environment components
│   │   │   │   ├── City.jsx   # City 3D model
│   │   │   │   ├── Charecter.jsx # Character component
│   │   │   │   └── AerialMinimap.jsx # Aerial view component
│   │   │   └── Virtual_Classroom/ # Virtual classroom components
│   │   │       ├── Scene.jsx   # Main classroom scene
│   │   │       ├── Classroom.jsx # Classroom 3D model
│   │   │       ├── Blackboard.jsx # Interactive blackboard
│   │   │       ├── LeftBoard.jsx # Left side board
│   │   │       └── RightBoard.jsx # Right side board
│   │   ├── contexts/          # React contexts
│   │   │   └── VirtualClassroomContext.jsx # Global state management
│   │   ├── Pages/             # Page components
│   │   │   ├── Home.jsx       # Landing page
│   │   │   ├── Virtualclassroom.jsx # Virtual classroom page
│   │   │   ├── Aiclassroom.jsx # AI classroom page
│   │   │   ├── Dashboard.jsx  # Dashboard page
│   │   │   ├── About.jsx      # About page
│   │   │   ├── Contact.jsx    # Contact page
│   │   │   └── Admin.jsx      # Admin page
│   │   ├── Routes/            # Routing configuration
│   │   │   └── Approuter.jsx  # Main router
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # App entry point
│   ├── public/               # Static assets
│   │   ├── models/           # 3D models (.glb files)
│   │   ├── hdri/            # HDRI environment maps
│   │   └── image/           # Images and logos
│   └── package.json         # Frontend dependencies
└── README.md               # This documentation
```

## 🔧 Backend Documentation

### Core Files

#### `server.js`
**Purpose**: Main Express server configuration and startup
**Dependencies**: Express, Socket.IO, CORS, dotenv
**Key Features**:
- CORS configuration for cross-origin requests
- Body parsing with 10MB limit for large payloads
- Socket.IO integration for real-time communication
- Error handling middleware
- Route mounting for API endpoints

#### `controllers/aiController.js`
**Purpose**: Handles AI chat functionality
**Functions**:
- `askQuestion(req, res)`: Processes user questions and returns AI responses
  - Input: `{ question: string }`
  - Output: `{ query_response: string, follow_up_questions: array, audio: string, detected_language: string }`
  - Logic: Language detection → Gemini AI processing → TTS conversion

#### `controllers/meetController.js`
**Purpose**: Manages meeting rooms and connections
**Functions**:
- `healthCheck(req, res)`: Server health status with active rooms info
- `checkRoom(req, res)`: Validates room existence and user count
- `testEndpoint(req, res)`: Simple connectivity test

#### `services/geminiService.js`
**Purpose**: Google Gemini AI integration
**Functions**:
- `generateGemini(detectedLang, question)`: Generates AI responses
  - Uses `gemini-2.5-flash-lite` model
  - Supports multiple languages (English, Hindi, Bhojpuri, Bengali)
  - Returns structured JSON responses
  - Temperature: 0.7, Max tokens: 300

#### `services/ttsService.js`
**Purpose**: Text-to-speech conversion using ElevenLabs
**Functions**:
- `ttsElevenLabs(text)`: Converts text to speech
  - Uses ElevenLabs multilingual model
  - Returns base64 encoded MP3 audio
  - Handles API errors gracefully

#### `sockets/socketInit.js`
**Purpose**: Socket.IO server configuration and event handling
**Key Features**:
- CORS configuration for Socket.IO
- Room management with active room tracking
- WebRTC signaling for peer connections
- Chat message relay
- Connection state management

**Events Handled**:
- `join-room`: User joins a meeting room
- `signal`: WebRTC signaling between peers
- `chat`: Chat message broadcasting
- `leave-room`: User leaves meeting
- `disconnect`: Connection cleanup

### Configuration Files

#### `config/corsConfig.js`
**Purpose**: CORS policy configuration
**Settings**: Allows all origins in development, configurable for production

#### `middlewares/errorHandler.js`
**Purpose**: Global error handling
**Logic**: CORS error detection and generic error responses

#### `utils/helpers.js`
**Purpose**: Utility functions
**Functions**:
- `toBase64(arrayBuffer)`: Converts ArrayBuffer to base64 string
- `detectLanguage(text)`: Simple language detection (English/Non-English)

## 🎨 Frontend Documentation

### Core Components

#### `App.jsx`
**Purpose**: Main application wrapper
**Dependencies**: React Router
**Structure**: Wraps the entire app with routing

#### `Routes/Approuter.jsx`
**Purpose**: Application routing configuration
**Routes**:
- `/` → Home page
- `/virtual-classroom` → Virtual classroom
- `/ai-classroom` → AI classroom
- `/about` → About page
- `/contact` → Contact page
- `/dashboard` → Dashboard
- `/admin` → Admin panel

### Pages

#### `Pages/Home.jsx`
**Purpose**: Landing page with navigation options
**Features**:
- Gradient background with glassmorphism design
- Navigation buttons to AI and Virtual classrooms
- Responsive design with Tailwind CSS

#### `Pages/Virtualclassroom.jsx`
**Purpose**: Virtual classroom interface
**Features**:
- Username modal for user identification
- Meeting creation and joining functionality
- Connection status indicators
- Integration with VirtualClassroomContext

#### `Pages/Aiclassroom.jsx`
**Purpose**: AI classroom interface
**Features**:
- 3D scene with AI instructor
- Interactive question-answer system
- Real-time AI responses with audio

### 3D Components

#### `components/Ai_classroom/Scene.jsx`
**Purpose**: AI classroom 3D environment
**Features**:
- Rahul Sir 3D model with animations
- Interactive blackboard for AI responses
- Question input interface
- Animation states: idle, thinking, talking
- Backend AI integration

**Key Functions**:
- `RahulSir`: 3D model with animation states
- `BlackboardPlaceholder`: Dynamic text rendering on blackboard
- `askRahulBackend`: AI question processing

#### `components/Virtual_Classroom/Scene.jsx`
**Purpose**: Virtual classroom 3D environment
**Features**:
- 3D classroom model
- Camera controls with Leva integration
- Room ID display and copying
- Environment lighting

#### `components/Virtual_Classroom/Blackboard.jsx`
**Purpose**: Interactive blackboard with video streams
**Features**:
- Video stream display on 3D blackboard
- Media controls (mute, camera, screen share)
- Pinned participant display
- WebRTC integration

### State Management

#### `contexts/VirtualClassroomContext.jsx`
**Purpose**: Global state management for virtual classroom
**State Variables**:
- Connection status and socket management
- User and room information
- Media streams and controls
- Participants and chat messages
- UI modal states

**Key Functions**:
- `createMeeting()`: Creates new meeting room
- `joinMeeting()`: Joins existing meeting
- `startMeeting()`: Initiates meeting with media
- `handleMuteToggle()`: Audio mute/unmute
- `handleCameraToggle()`: Video on/off
- `handleScreenShare()`: Screen sharing functionality
- `sendMessage()`: Chat message sending
- `pinParticipant()`: Pin participant for focus

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Modern browser with WebRTC support

### Backend Setup
```bash
cd Backend
npm install
```

**Environment Variables** (create `.env` file):
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
NODE_ENV=development
```

**Start Backend**:
```bash
npm start
```

### Frontend Setup
```bash
cd Frontend
npm install
```

**Environment Variables** (create `.env` file):
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

**Start Frontend**:
```bash
npm run dev
```

## 🔌 API Endpoints

### AI Endpoints
- `POST /api/ask` - Send question to AI
  - Body: `{ question: string }`
  - Response: `{ query_response: string, follow_up_questions: array, audio: string, detected_language: string }`

### Meeting Endpoints
- `GET /api/meet/health` - Server health check
- `GET /api/meet/check-room/:roomId` - Check room existence
- `GET /api/meet/test` - Connection test

## 🎮 Socket.IO Events

### Client to Server
- `join-room` - Join a meeting room
- `signal` - WebRTC signaling data
- `chat` - Send chat message
- `leave-room` - Leave current room

### Server to Client
- `user-connected` - New user joined
- `user-disconnected` - User left
- `signal` - WebRTC signaling data
- `chat` - Receive chat message
- `room-joined` - Successfully joined room
- `room-error` - Room-related error

## 🎨 3D Assets

### Models
- `Ai_classroom.glb` - AI classroom environment
- `Classroom.glb` - Virtual classroom environment
- `City.glb` - City environment
- `rahulsir.glb` - AI instructor character
- `Character.glb` - Generic character model

### HDRI Environments
- `venice_dawn_1_1k.hdr` - Venice dawn lighting
- `horn-koppe_spring_1k.hdr` - Spring mountain lighting
- `victoria_sunset_1k.hdr` - Sunset lighting

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Google Gemini AI** - AI responses
- **ElevenLabs** - Text-to-speech
- **WebRTC** - Peer-to-peer video

### Frontend
- **React** - UI framework
- **React Three Fiber** - 3D rendering
- **Three.js** - 3D graphics library
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Leva** - 3D controls

## 🔧 Development Notes

### Best Practices
1. **Error Handling**: Comprehensive error handling in both frontend and backend
2. **State Management**: Centralized state with React Context
3. **3D Performance**: Optimized 3D models and textures
4. **WebRTC**: Proper connection cleanup and error recovery
5. **Responsive Design**: Mobile-friendly interfaces

### Potential Improvements
1. **Authentication**: User authentication system
2. **Database**: Persistent storage for meetings and users
3. **Scalability**: Redis for session management
4. **Security**: Enhanced CORS and input validation
5. **Testing**: Unit and integration tests
6. **Documentation**: API documentation with Swagger

### Known Issues
1. **Browser Compatibility**: WebRTC requires modern browsers
2. **Mobile Support**: Limited mobile 3D performance
3. **Network Requirements**: Stable internet connection required
4. **Model Loading**: Large 3D models may take time to load

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Immersio** - Bringing education into the virtual realm with cutting-edge technology.
