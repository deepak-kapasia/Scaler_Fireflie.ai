"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { formatDuration } from "@/lib/utils";

interface MediaPlayerProps {
  duration: number; // total meeting duration in seconds
  onTimeUpdate: (currentTime: number) => void;
  onSeek: (seek: (time: number) => void) => void; // expose seek fn
}

export default function MediaPlayer({ duration, onTimeUpdate, onSeek }: MediaPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);

  // Simulated playback since there's no actual audio file
  const tick = useCallback(() => {
    timeRef.current += 0.25 * playbackRate;
    if (timeRef.current >= duration) {
      timeRef.current = duration;
      setIsPlaying(false);
    }
    setCurrentTime(timeRef.current);
    onTimeUpdate(timeRef.current);
  }, [duration, onTimeUpdate, playbackRate]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, tick]);

  // Expose seek function to parent (for transcript → player sync)
  const seek = useCallback((time: number) => {
    timeRef.current = Math.max(0, Math.min(time, duration));
    setCurrentTime(timeRef.current);
    onTimeUpdate(timeRef.current);
  }, [duration, onTimeUpdate]);

  useEffect(() => {
    onSeek(seek);
  }, [seek, onSeek]);

  const togglePlay = () => setIsPlaying((p) => !p);
  const toggleMute = () => setMuted((m) => !m);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    seek(t);
  };

  const handleSkip = (secs: number) => {
    seek(timeRef.current + secs);
  };

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const nextRate = () => {
    const idx = rates.indexOf(playbackRate);
    setPlaybackRate(rates[(idx + 1) % rates.length]);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="relative mb-3">
          <div className="relative h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.5}
            value={currentTime}
            onChange={handleScrub}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5"
            aria-label="Playback position"
            id="media-player-scrubber"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Time */}
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 min-w-[80px]">
            {formatDuration(Math.floor(currentTime))} / {formatDuration(duration)}
          </span>

          {/* Transport buttons */}
          <div className="flex items-center gap-1">
            {/* Skip back 10s */}
            <button onClick={() => handleSkip(-10)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Skip back 10 seconds" id="player-skip-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8a5 5 0 105-5H5m0 0L3 1m2 2L3 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <text x="5" y="11" fontSize="4" fill="currentColor" fontWeight="bold">10</text>
              </svg>
            </button>

            {/* Play/Pause */}
            <button onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm"
              aria-label={isPlaying ? "Pause" : "Play"} id="player-play-pause">
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2.5" y="2" width="3.5" height="10" rx="1" fill="white" />
                  <rect x="8" y="2" width="3.5" height="10" rx="1" fill="white" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 2.5l8 4.5-8 4.5V2.5z" fill="white" />
                </svg>
              )}
            </button>

            {/* Skip forward 10s */}
            <button onClick={() => handleSkip(10)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Skip forward 10 seconds" id="player-skip-forward">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8a5 5 0 11-5-5h3m0 0l2 -2m-2 2l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <text x="5" y="11" fontSize="4" fill="currentColor" fontWeight="bold">10</text>
              </svg>
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Playback rate */}
          <button onClick={nextRate}
            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition min-w-[42px] text-center"
            aria-label="Change playback speed" id="player-speed">
            {playbackRate}×
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label={muted ? "Unmute" : "Mute"} id="player-mute">
              {muted || volume === 0 ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3L4.5 6.5H2.5v3h2L8 13V3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  <path d="M10.5 10.5l3-3M13.5 10.5l-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M7 3.5L3.5 6.5H1.5v3h2L7 12.5V3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  <path d="M10 6.5a2.5 2.5 0 010 3M11.5 4.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
              className="w-16 accent-violet-600" aria-label="Volume" id="player-volume" />
          </div>

          {/* Simulated label */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500">Simulated playback</span>
          </div>
        </div>
      </div>
    </div>
  );
}
