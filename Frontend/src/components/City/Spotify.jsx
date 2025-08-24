import { useState, useEffect } from "react";
import { Music } from "lucide-react";

export default function Spotify() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [token, setToken] = useState(null);

  // Function to fetch new token using client credentials
  async function fetchToken() {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          btoa(
            `${import.meta.env.VITE_SPOTIFY_CLIENT_ID}:${import.meta.env.VITE_SPOTIFY_CLIENT_SECRET}`
          ),
      },
      body: "grant_type=client_credentials",
    });
    const data = await res.json();
    setToken(data.access_token);
    return data.access_token;
  }

  // Fetch token on mount & auto refresh every 55 minutes
  useEffect(() => {
    (async () => {
      const newToken = await fetchToken();
      setToken(newToken);

      // Refresh token before it expires (tokens expire in 3600s)
      const interval = setInterval(fetchToken, 55 * 60 * 1000);
      return () => clearInterval(interval);
    })();
  }, []);

  // Fetch playlist tracks whenever token updates
  useEffect(() => {
    if (!token) return;

    async function fetchPlaylistTracks() {
      try {
        const res = await fetch(
          "https://api.spotify.com/v1/playlists/5TSFbJXcNrS8k8TQ1O7asy/tracks",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.items) {
          const mapped = data.items.map((item) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists.map((a) => a.name).join(", "),
            image: item.track.album?.images?.[2]?.url,
          }));
          setTracks(mapped);
        }
      } catch (err) {
        console.error("Spotify fetch error:", err);
      }
    }

    fetchPlaylistTracks();
  }, [token]);

  return (
    <div>
      {/* Music Button */}
      <button
        onClick={() => setShowPlayer(!showPlayer)}
        className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-3 rounded-full shadow-lg"
      >
        <Music size={24} />
      </button>

      {/* Music Popup */}
      {showPlayer && (
        <div className="absolute top-16 right-4 bg-black/90 p-3 rounded-xl shadow-lg w-80 overflow-y-auto max-h-[60vh]">
          <h2 className="text-white text-sm mb-2">Your Playlist Tracks</h2>
          <ul className="text-white text-xs space-y-2">
            {tracks.map((track) => (
              <li
                key={track.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 p-1 rounded"
                onClick={() => setCurrentTrack(track.id)}
              >
                {track.image && (
                  <img
                    src={track.image}
                    alt={track.name}
                    className="w-10 h-10 rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{track.name}</p>
                  <p className="text-gray-400">{track.artist}</p>
                </div>
              </li>
            ))}
          </ul>

          {currentTrack && (
            <iframe
              key={currentTrack}
              className="mt-3 rounded-xl"
              src={`https://open.spotify.com/embed/track/${currentTrack}?utm_source=generator&autoplay=1`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            ></iframe>
          )}
        </div>
      )}
    </div>
  );
}
