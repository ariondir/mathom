import { useEffect, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import type { LibraryFile } from '../api/files';
import { getFiles, addFile, removeFile, removeCollection } from '../api/files';
import { FileCard } from './FileCard';
import { CollectionCard } from './CollectionCard';
import { HobbitDoor } from './HobbitDoor';
import { ShireScene } from './ShireScene';

type SectionKey = LibraryFile['section'];

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
  { key: 'book',  label: 'Books' },
  { key: 'other', label: 'Other' },
];

interface GroupedSection {
  collections: Map<string, LibraryFile[]>;
  singles: LibraryFile[];
}

function groupSection(files: LibraryFile[]): GroupedSection {
  const collections = new Map<string, LibraryFile[]>();
  const singles: LibraryFile[] = [];

  for (const file of files) {
    if (file.collectionId) {
      const group = collections.get(file.collectionId) ?? [];
      group.push(file);
      collections.set(file.collectionId, group);
    } else {
      singles.push(file);
    }
  }

  // Sort each collection's files by name (chapter order)
  for (const [id, group] of collections) {
    collections.set(id, group.sort((a, b) => a.name.localeCompare(b.name)));
  }

  return { collections, singles };
}

export function Library() {
  const [files, setFiles]   = useState<LibraryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);

  async function load() {
    setLoading(true);
    try { setFiles(await getFiles()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAddFiles() {
    setAdding(true);
    try {
      const selected = await open({ multiple: true });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      await Promise.all(paths.map((p) => addFile(p)));
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    await removeFile(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleRemoveCollection(collectionId: string) {
    await removeCollection(collectionId);
    setFiles((prev) => prev.filter((f) => f.collectionId !== collectionId));
  }

  if (loading) return <div className="library-loading">A moment, dear friend…</div>;

  const hasFiles = files.length > 0;

  return (
    <div className="library">
      <div className="library-header">
        <div className="library-title">
          <HobbitDoor size={42} />
          <h1>Mathom</h1>
        </div>
      </div>

      {/* Explanation banner — no repeated door, just a book icon and the definition */}
      {hasFiles && (
        <div className="mathom-info-banner">
          <span className="mathom-info-icon">📚</span>
          <span className="mathom-info-text">
            A <em>mathom</em> is any treasure too good to throw away —
            books, audiobooks, music &amp; video, all in one Shire.
          </span>
        </div>
      )}

      {!hasFiles && <ShireScene onAdd={handleAddFiles} adding={adding} />}

      {SECTIONS.map(({ key, label }) => {
        const sectionFiles = files.filter((f) => f.section === key);
        if (sectionFiles.length === 0) return null;

        const { collections, singles } = groupSection(sectionFiles);
        const totalItems = collections.size + singles.length;

        return (
          <div key={key} className="library-section">
            <h2 className="section-header">
              {label} <span className="section-count">{totalItems}</span>
            </h2>

            {/* Collections */}
            {collections.size > 0 && (
              <div className="collection-list">
                {[...collections.entries()].map(([collectionId, colFiles]) => (
                  <CollectionCard
                    key={collectionId}
                    name={colFiles[0].collectionName ?? 'Unknown Collection'}
                    files={colFiles}
                    onRemove={() => handleRemoveCollection(collectionId)}
                  />
                ))}
              </div>
            )}

            {/* Individual files */}
            {singles.length > 0 && (
              <div className="file-grid">
                {singles.map((file) => (
                  <FileCard key={file.id} file={file} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add button at the bottom — out of the way but easy to find */}
      {hasFiles && (
        <div className="library-add-bottom">
          <button className="btn-primary" onClick={handleAddFiles} disabled={adding}>
            {adding ? 'Adding…' : '+ Add Mathoms'}
          </button>
        </div>
      )}
    </div>
  );
}
