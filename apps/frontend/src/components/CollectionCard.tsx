import { useState } from 'react';
import type { LibraryFile } from '../api/files';
import { usePlayer } from '../contexts/PlayerContext';

const BASE = 'http://localhost:7575';

function formatSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}

interface Props {
  name: string;
  files: LibraryFile[];
  onRemove: () => void;
}

export function CollectionCard({ name, files, onRemove }: Props) {
  const [expanded,   setExpanded]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { play, currentFile } = usePlayer();

  const cover     = files.find((f) => f.coverPath);
  const coverUrl  = cover ? `${BASE}/files/${cover.id}/cover` : null;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const author    = files[0]?.author ?? null;
  const isActive  = files.some((f) => f.id === currentFile?.id);

  function handlePlay(file: LibraryFile) {
    play(file, files);
  }

  return (
    <div className={`collection-card${isActive ? ' collection-card--active' : ''}`}>
      {/* Main card row */}
      <div className="collection-card-main" onClick={() => !confirming && setExpanded(e => !e)}>
        {coverUrl
          ? <img className="collection-cover" src={coverUrl} alt={name} />
          : <div className="collection-cover-placeholder">♪</div>
        }
        <div className="collection-info">
          <div className="collection-name">{name}</div>
          {author && <div className="collection-author">{author}</div>}
          <div className="collection-meta">
            <span className="file-badge">audio</span>
            <span>{files.length} chapters</span>
            <span>{formatSize(totalSize)}</span>
          </div>
        </div>
        <div className="collection-actions">
          <button
            className="collection-play-btn"
            onClick={(e) => { e.stopPropagation(); handlePlay(files[0]); }}
            title="Play from beginning"
          >▶</button>
          <span className="collection-chevron">{expanded ? '▲' : '▼'}</span>
        </div>

        {confirming ? (
          <div className="collection-confirm" onClick={e => e.stopPropagation()}>
            <span className="collection-confirm-label">Remove {files.length} chapters?</span>
            <button className="file-card-confirm-yes" onClick={onRemove}>Yes</button>
            <button className="file-card-confirm-no"  onClick={() => setConfirming(false)}>No</button>
          </div>
        ) : (
          <button
            className="collection-remove"
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            title="Remove from library"
          >×</button>
        )}
      </div>

      {/* Chapter list */}
      {expanded && (
        <div className="chapter-list">
          {files.map((file, i) => {
            const isPlaying   = currentFile?.id === file.id;
            const chapterName = file.title ?? file.name.replace(/\.[^.]+$/, '');
            return (
              <div
                key={file.id}
                className={`chapter-row${isPlaying ? ' chapter-row--active' : ''}`}
                onClick={() => handlePlay(file)}
              >
                <span className="chapter-num">{i + 1}</span>
                <span className="chapter-name">{chapterName}</span>
                <span className="chapter-play">{isPlaying ? '▶' : '▷'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
