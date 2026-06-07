import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { useSessionStore } from '@/stores/sessionStore';
import { socketEmit } from '@/lib/socket';

export default function AudioPlayer() {
  const isDM = useSessionStore((s) => s.isDM);
  const { currentTrack, isPlaying, volume, tracks, setTrack, play, pause, setVolume, setAudioElement, stopAll } =
    useAudioStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
    return () => setAudioElement(null);
  }, [setAudioElement]);

  if (!isDM) return null; // Only DM sees audio controls

  const handleTrackSelect = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    setTrack(track);
    socketEmit.audioPlay(trackId);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
      socketEmit.audioPause();
    } else {
      play();
      if (currentTrack) socketEmit.audioPlay(currentTrack.id);
    }
  };

  const handleVolume = (vol: number) => {
    setVolume(vol);
    socketEmit.audioVolume(vol);
  };

  const categories = Array.from(new Set(tracks.map((t) => t.category)));

  return (
    <>
      <audio ref={audioRef} loop preload="none" />

      {/* Floating button */}
      <div
        className="absolute bottom-16 right-4 z-50"
        style={{ pointerEvents: 'auto' }}
      >
        {isOpen && (
          <div
            className="parchment-panel rounded-sm mb-2 p-3 w-64"
            style={{
              boxShadow: '0 -4px 20px rgba(0,0,0,0.6)',
              animation: 'floatIn 0.3s ease-out',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-cinzel font-semibold text-dark-brown text-sm">
                🎵 Ambient Audio
              </h3>
              <span className="font-crimson text-xs text-medium-brown italic">(DM only)</span>
            </div>

            {/* Now playing */}
            <div
              className="flex items-center gap-2 p-2 mb-3 rounded-sm"
              style={{ background: 'rgba(45,27,0,0.1)', border: '1px solid rgba(92,61,30,0.4)' }}
            >
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  background: isPlaying ? '#c9a227' : 'rgba(201,162,39,0.3)',
                  border: '1px solid rgba(201,162,39,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel text-xs text-dark-brown truncate font-semibold">
                  {currentTrack?.name ?? 'No track selected'}
                </p>
                {currentTrack && (
                  <p className="font-crimson text-xs text-medium-brown capitalize">
                    {currentTrack.category}
                  </p>
                )}
              </div>
              {currentTrack && (
                <button
                  onClick={stopAll}
                  className="font-cinzel text-xs"
                  style={{ background: 'none', border: 'none', color: '#8b1a1a', cursor: 'pointer' }}
                >
                  ■
                </button>
              )}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-cinzel text-xs text-dark-brown">🔊</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolume(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#c9a227',
                  cursor: 'pointer',
                }}
              />
              <span className="font-cinzel text-xs text-medium-brown w-8 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Track list by category */}
            <div
              className="flex flex-col gap-1 max-h-40 overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              {categories.map((cat) => (
                <div key={cat}>
                  <p
                    className="font-cinzel text-xs uppercase tracking-wider mb-0.5"
                    style={{ color: 'rgba(92,61,30,0.7)' }}
                  >
                    {cat}
                  </p>
                  {tracks
                    .filter((t) => t.category === cat)
                    .map((track) => (
                      <button
                        key={track.id}
                        onClick={() => handleTrackSelect(track.id)}
                        className="w-full text-left px-2 py-1 font-crimson text-sm transition-all"
                        style={{
                          background:
                            currentTrack?.id === track.id
                              ? 'rgba(201,162,39,0.2)'
                              : 'transparent',
                          border: 'none',
                          color:
                            currentTrack?.id === track.id ? '#2d1b00' : '#5c3d1e',
                          cursor: 'pointer',
                          borderLeft:
                            currentTrack?.id === track.id
                              ? '2px solid #c9a227'
                              : '2px solid transparent',
                        }}
                      >
                        {currentTrack?.id === track.id && isPlaying ? '▶ ' : ''}
                        {track.name}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen((o) => !o)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-tavern-lg"
          style={{
            background: isPlaying
              ? 'linear-gradient(135deg, #c9a227, #a8831a)'
              : 'linear-gradient(135deg, #3d2408, #2d1b00)',
            border: '2px solid #c9a227',
            boxShadow: isPlaying
              ? '0 0 16px rgba(201,162,39,0.5)'
              : '0 4px 12px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            animation: isPlaying ? 'pulseGold 2s ease-in-out infinite' : 'none',
          }}
          title="Audio Controls (DM)"
        >
          🎵
        </button>
      </div>
    </>
  );
}
