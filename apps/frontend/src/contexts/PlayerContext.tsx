import { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';
import type { LibraryFile } from '../api/files';

const BASE = 'http://localhost:7575';

interface PlayerContextValue {
  currentFile: LibraryFile | null;
  playlist: LibraryFile[];
  playlistIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  play: (file: LibraryFile, playlist?: LibraryFile[]) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setSpeed: (rate: number) => void;
  nextChapter: () => void;
  prevChapter: () => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function posKey(id: string) { return `audio-pos-${id}`; }

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentFile, setCurrentFile]     = useState<LibraryFile | null>(null);
  const [playlist, setPlaylist]           = useState<LibraryFile[]>([]);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [currentTime, setCurrentTime]     = useState(0);
  const [duration, setDuration]           = useState(0);
  const [speed, setSpeedState]            = useState(1);

  const audioRef       = useRef<HTMLAudioElement>(null);
  const currentFileRef = useRef<LibraryFile | null>(null);  // stable ref for handlers
  const lastSaveRef    = useRef(0);                          // throttle position saves
  const playlistRef    = useRef<LibraryFile[]>([]);
  const indexRef       = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { currentFileRef.current = currentFile; }, [currentFile]);
  useEffect(() => { playlistRef.current = playlist; },      [playlist]);
  useEffect(() => { indexRef.current = playlistIndex; },    [playlistIndex]);

  // When currentFile changes: load src and restore saved position
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentFile) return;

    const key = posKey(currentFile.id);

    const onLoaded = () => {
      const saved = localStorage.getItem(key);
      if (saved) {
        const t = parseFloat(saved);
        // Only restore if not within last 3 seconds (treat that as "done")
        if (t > 0 && t < audio.duration - 3) {
          audio.currentTime = t;
        }
      }
      audio.play().catch(() => {});
    };

    audio.addEventListener('loadedmetadata', onLoaded, { once: true });
    audio.src = `${BASE}/files/${currentFile.id}/stream`;
    audio.playbackRate = speed;

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFile]);

  function play(file: LibraryFile, newPlaylist?: LibraryFile[]) {
    const list = newPlaylist ?? [file];
    const idx  = list.findIndex((f) => f.id === file.id);
    setPlaylist(list);
    setPlaylistIndex(idx >= 0 ? idx : 0);
    setCurrentFile(file);
  }

  function nextChapter() {
    const list = playlistRef.current;
    const idx  = indexRef.current;
    if (idx < list.length - 1) {
      setPlaylistIndex(idx + 1);
      setCurrentFile(list[idx + 1]);
    }
  }

  function prevChapter() {
    const list = playlistRef.current;
    const idx  = indexRef.current;
    if (idx > 0) {
      setPlaylistIndex(idx - 1);
      setCurrentFile(list[idx - 1]);
    }
  }

  function pause()  { audioRef.current?.pause(); }
  function resume() { audioRef.current?.play().catch(() => {}); }

  function seek(time: number) {
    if (audioRef.current) audioRef.current.currentTime = time;
  }

  function setSpeed(rate: number) {
    setSpeedState(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }

  function close() {
    // Save position before closing
    const audio = audioRef.current;
    const file  = currentFileRef.current;
    if (audio && file && audio.currentTime > 0) {
      localStorage.setItem(posKey(file.id), String(audio.currentTime));
    }
    audio?.pause();
    setCurrentFile(null);
    setPlaylist([]);
    setPlaylistIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);

    // Save position at most once every 5 seconds
    const now = Date.now();
    if (now - lastSaveRef.current > 5_000) {
      lastSaveRef.current = now;
      const file = currentFileRef.current;
      if (file && audio.currentTime > 0) {
        localStorage.setItem(posKey(file.id), String(audio.currentTime));
      }
    }
  }

  function handlePause() {
    setIsPlaying(false);
    // Always save on pause (user explicitly stopped)
    const audio = audioRef.current;
    const file  = currentFileRef.current;
    if (audio && file && audio.currentTime > 0) {
      localStorage.setItem(posKey(file.id), String(audio.currentTime));
    }
  }

  function handleEnded() {
    setIsPlaying(false);
    // Clear saved position — chapter is done
    const file = currentFileRef.current;
    if (file) localStorage.removeItem(posKey(file.id));

    // Auto-advance to next chapter
    const list = playlistRef.current;
    const idx  = indexRef.current;
    if (idx < list.length - 1) {
      setPlaylistIndex(idx + 1);
      setCurrentFile(list[idx + 1]);
    }
  }

  return (
    <PlayerContext.Provider value={{
      currentFile, playlist, playlistIndex,
      isPlaying, currentTime, duration, speed,
      play, pause, resume, seek, setSpeed,
      nextChapter, prevChapter, close,
    }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onEnded={handleEnded}
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
