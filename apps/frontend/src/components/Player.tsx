import { usePlayer } from '../contexts/PlayerContext';

const BASE = 'http://localhost:7575';
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function Player() {
  const {
    currentFile, playlist, playlistIndex,
    isPlaying, currentTime, duration, speed,
    pause, resume, seek, setSpeed,
    nextChapter, prevChapter, close,
  } = usePlayer();

  if (!currentFile) return null;

  const coverUrl    = currentFile.coverPath ? `${BASE}/files/${currentFile.id}/cover` : null;
  const displayName = currentFile.collectionName ?? currentFile.title ?? currentFile.name;
  const progress    = duration > 0 ? currentTime / duration : 0;
  const inPlaylist  = playlist.length > 1;

  return (
    <div className="player">
      <div className="player-info">
        {coverUrl
          ? <img className="player-cover" src={coverUrl} alt={displayName} />
          : <div className="player-cover-placeholder">♪</div>
        }
        <div className="player-text">
          <div className="player-title">{displayName}</div>
          {inPlaylist && (
            <div className="player-chapter">
              Ch. {playlistIndex + 1} of {playlist.length}
            </div>
          )}
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
          {inPlaylist && (
            <button onClick={prevChapter} disabled={playlistIndex === 0} title="Previous chapter">⏮</button>
          )}
          <button onClick={() => seek(currentTime - 30)} title="Back 30s">
            <span className="player-icon">⏪</span>
            <span className="player-icon-label">30</span>
          </button>
          <button className="player-play-btn" onClick={isPlaying ? pause : resume}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={() => seek(currentTime + 30)} title="Forward 30s">
            <span className="player-icon">⏩</span>
            <span className="player-icon-label">30</span>
          </button>
          {inPlaylist && (
            <button onClick={nextChapter} disabled={playlistIndex === playlist.length - 1} title="Next chapter">⏭</button>
          )}
        </div>
        <div className="player-scrub-row">
          <span className="player-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="player-scrubber"
            min={0}
            max={duration || 0}
            step={1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ '--progress': `${progress * 100}%` } as React.CSSProperties}
          />
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <select className="player-speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
        <button className="player-close" onClick={close} title="Close player">×</button>
      </div>
    </div>
  );
}
