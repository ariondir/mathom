const BASE = 'http://localhost:7575';

export interface LibraryFile {
  id: string;
  name: string;
  title: string | null;
  author: string | null;
  path: string;
  mimeType: string;
  size: number;
  section: 'audio' | 'video' | 'book' | 'other';
  coverPath: string | null;
  collectionId: string | null;
  collectionName: string | null;
  createdAt: string;
}

export async function getFiles(): Promise<LibraryFile[]> {
  const res = await fetch(`${BASE}/files`);
  return res.json();
}

export async function addFile(path: string): Promise<LibraryFile[]> {
  const res = await fetch(`${BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  return res.json();
}

export async function removeFile(id: string): Promise<void> {
  await fetch(`${BASE}/files/${id}`, { method: 'DELETE' });
}

export async function removeCollection(collectionId: string): Promise<void> {
  await fetch(`${BASE}/files/collection/${collectionId}`, { method: 'DELETE' });
}
