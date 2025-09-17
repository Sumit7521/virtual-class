import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-red-500 via-black to-gray-900 text-white">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl flex flex-col items-center w-[90vw] max-w-[600px] gap-6">
        
        {/* Logo */}
        <img
          src="./image/techno full logo.png"
          alt="Techno India"
          className="w-[80%] object-contain mb-4"
        />

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Welcome to Techno India University!
        </h1>
        <p className="text-lg md:text-xl text-center mb-4">
          Where do you want to go?
        </p>

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => navigate("/ai-classroom")}
            className="flex-1 py-4 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-lg transition"
          >
            AI Classroom
          </button>
          <button
            onClick={() => navigate("/virtual-classroom")}
            className="flex-1 py-4 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-lg transition"
          >
            Virtual Classroom
          </button>
        </div>
      </div>
    </div>
  );
}
