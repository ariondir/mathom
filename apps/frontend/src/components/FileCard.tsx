import { useState } from 'react';
import { openPath } from '@tauri-apps/plugin-opener';
import type { LibraryFile } from '../api/files';
import { usePlayer } from '../contexts/PlayerContext';
import { useReader } from '../contexts/ReaderContext';

const BASE = 'http://localhost:7575';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

interface Props {
  file: LibraryFile;
  onRemove: (id: string) => void;
}

export function FileCard({ file, onRemove }: Props) {
  const { play, currentFile } = usePlayer();
  const { openBook } = useReader();
  const [confirming, setConfirming] = useState(false);

  const displayName = file.title ?? file.name;
  const date        = new Date(file.createdAt).toLocaleDateString();
  const coverUrl    = file.coverPath ? `${BASE}/files/${file.id}/cover` : null;
  const isActive    = currentFile?.id === file.id;

  function handleClick() {
    if (confirming) return;
    if (file.section === 'audio') {
      play(file);
    } else if (file.mimeType === 'application/epub+zip') {
      openBook(file);
    } else {
      openPath(file.path);
    }
  }

  return (
    <div className={`file-card${isActive ? ' file-card--active' : ''}`} onClick={handleClick}>
      {coverUrl && (
        <img className="file-card-cover" src={coverUrl} alt={displayName} />
      )}
      {file.section === 'audio' && !coverUrl && (
        <div className="file-card-audio-placeholder">♪</div>
      )}
      <div className="file-card-body">
        <div className="file-card-name" title={file.path}>{displayName}</div>
        {file.author && <div className="file-card-author">{file.author}</div>}
        <div className="file-card-meta">
          <span className="file-badge">{file.section}</span>
          <span>{formatSize(file.size)}</span>
          <span>{date}</span>
        </div>
      </div>

      {confirming ? (
        <div className="file-card-confirm" onClick={e => e.stopPropagation()}>
          <span className="file-card-confirm-label">Remove?</span>
          <button className="file-card-confirm-yes" onClick={() => onRemove(file.id)}>Yes</button>
          <button className="file-card-confirm-no"  onClick={() => setConfirming(false)}>No</button>
        </div>
      ) : (
        <button
          className="file-card-remove"
          onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
          title="Remove from library"
        >×</button>
      )}
    </div>
  );
}
