import { createContext, useContext, useState, ReactNode } from 'react';
import type { LibraryFile } from '../api/files';

interface ReaderContextValue {
  currentBook: LibraryFile | null;
  openBook:    (file: LibraryFile) => void;
  closeBook:   () => void;
}

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [currentBook, setCurrentBook] = useState<LibraryFile | null>(null);

  return (
    <ReaderContext.Provider value={{
      currentBook,
      openBook:  (file) => setCurrentBook(file),
      closeBook: ()     => setCurrentBook(null),
    }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error('useReader must be used within ReaderProvider');
  return ctx;
}
