import { useEffect, useRef, useState, useCallback } from 'react';
import ePub, { type Book, type Rendition, type NavItem, type Location } from 'epubjs';
import { useReader } from '../contexts/ReaderContext';
import { usePlayer } from '../contexts/PlayerContext';
import { HobbitDoor } from './HobbitDoor';
import type { LibraryFile } from '../api/files';

const BASE = 'http://localhost:7575';

const SHIRE_THEME = {
  body: {
    background:    '#0c0f07 !important',
    color:         '#e4d9b0 !important',
    'font-family': '"IM Fell English","Palatino Linotype",Georgia,serif !important',
    'line-height': '1.8 !important',
    padding:       '0 2rem !important',
    margin:        '0 auto !important',
  },
  'h1,h2,h3,h4,h5,h6': {
    color:         '#c9a84c !important',
    'font-family': '"Cinzel","Palatino Linotype",serif !important',
  },
  p:   { 'margin-bottom': '1em !important' },
  a:   { color: '#6a9a28 !important' },
};

type Mode = 'read' | 'listen';

interface Props { file: LibraryFile }

export function Reader({ file }: Props) {
  const { closeBook }                                    = useReader();
  const { currentFile: audioFile, isPlaying }           = usePlayer();
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef      = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [mode,          setMode]         = useState<Mode>('read');
  const [toc,           setToc]          = useState<NavItem[]>([]);
  const [showToc,       setShowToc]      = useState(false);
  const [fontSize,      setFontSize]     = useState(100);
  const [progress,      setProgress]     = useState(0);
  const [atStart,       setAtStart]      = useState(false);
  const [atEnd,         setAtEnd]        = useState(false);
  const [loadingMsg,    setLoadingMsg]   = useState('Fetching the book…');
  const [error,         setError]        = useState<string | null>(null);
  const [chapterTitle,  setChapterTitle] = useState('');
  const [pageInSection, setPageInSection] = useState(0);
  const [pagesInSection, setPagesInSection] = useState(0);

  // Ref so the relocated handler always sees the latest TOC without re-registering
  const tocRef = useRef<NavItem[]>([]);
  useEffect(() => { tocRef.current = toc; }, [toc]);

  const storageKey = `reader-cfi-${file.id}`;
  const hasAudio   = !!audioFile;

  const handleKey = useCallback((e: KeyboardEvent) => {
    const r = renditionRef.current;
    if (!r) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); r.next(); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); r.prev(); }
    if (e.key === 'Escape') closeBook();
  }, [closeBook]);

  useEffect(() => {
    const container = containerRef.current;
    const wrapper   = wrapperRef.current;
    if (!container || !wrapper) return;

    let cancelled = false;
    let book: Book | null = null;

    const init = async () => {
      try {
        setLoadingMsg('Fetching the book…');
        const res = await fetch(`${BASE}/files/${file.id}/stream`);
        if (!res.ok) throw new Error(`Server returned ${res.status} – is the backend running?`);
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        setLoadingMsg('Parsing pages…');
        book = ePub(buffer);
        bookRef.current = book;

        book.loaded.navigation
          .then((nav) => { if (!cancelled) setToc(nav.toc); })
          .catch(() => {});

        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        if (cancelled) return;

        const { width, height } = wrapper.getBoundingClientRect();
        const w = Math.floor(width)  || 800;
        const h = Math.floor(height) || 600;

        const rendition = book.renderTo(container, {
          width:  w,
          height: h,
          flow:   'paginated',
          spread: 'none',
        });
        renditionRef.current = rendition;

        rendition.themes.register('shire', SHIRE_THEME);
        rendition.themes.select('shire');
        rendition.themes.fontSize(`${fontSize}%`);

        // Inject scrollbar styles into the epub.js iframe each time content loads
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rendition.hooks.content.register((contents: any) => {
          contents.addStylesheetCss(`
            /* No horizontal scrollbar */
            ::-webkit-scrollbar { width: 5px; height: 0; }
            /* Dark vertical scrollbar — visible but not jarring */
            ::-webkit-scrollbar-track { background: #0c0f07; }
            ::-webkit-scrollbar-thumb { background: #2a3d14; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #3d5a1e; }
            body { overflow-x: hidden !important; }
          `);
        });

        rendition.on('relocated', (loc: Location) => {
          if (cancelled) return;
          setProgress(loc.start.percentage ?? 0);
          setAtStart(!!loc.atStart);
          setAtEnd(!!loc.atEnd);
          if (loc.start.cfi) localStorage.setItem(storageKey, loc.start.cfi);

          // Page within current section — available without generating locations
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const displayed = (loc.start as any).displayed;
          if (displayed) {
            setPageInSection(displayed.page  ?? 0);
            setPagesInSection(displayed.total ?? 0);
          }

          // Match current spine href against TOC to get chapter title
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const href: string = (loc.start as any).href ?? '';
          if (href) {
            const title = findChapterTitle(tocRef.current, href);
            if (title) setChapterTitle(title);
          }
        });

        setLoadingMsg('Rendering…');
        const saved = localStorage.getItem(storageKey);
        try {
          await (saved ? rendition.display(saved) : rendition.display());
        } catch {
          localStorage.removeItem(storageKey);
          await rendition.display();
        }

        if (!cancelled) setLoadingMsg('');

        // Generate locations in background; refresh % once ready
        book.locations.generate(1024).then(() => {
          if (cancelled) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cur = (rendition as any).currentLocation();
          if (cur?.start?.cfi) {
            const pct = book.locations.percentageFromCfi(cur.start.cfi);
            if (typeof pct === 'number') setProgress(pct);
          }
        }).catch(() => {});
      } catch (err: unknown) {
        if (!cancelled) {
          setError(String(err));
          setLoadingMsg('');
        }
      }
    };

    init();

    const onResize = () => {
      if (!renditionRef.current || !wrapper) return;
      const { width: nw, height: nh } = wrapper.getBoundingClientRect();
      renditionRef.current.resize(Math.floor(nw) || 800, Math.floor(nh) || 600);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', handleKey);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', handleKey);
      book?.destroy();
      bookRef.current    = null;
      renditionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  function adjustFontSize(delta: number) {
    const next = Math.max(80, Math.min(160, fontSize + delta));
    setFontSize(next);
    renditionRef.current?.themes.fontSize(`${next}%`);
  }

  function goToHref(href: string) {
    renditionRef.current?.display(href);
    setShowToc(false);
  }

  const isLoading   = loadingMsg !== '';
  const displayName = file.title ?? file.name;
  // In listen mode the overlay fills full screen (the listen UI has its own controls)
  // In read mode it lifts above the player bar when audio is active
  const overlayClass = [
    'reader-overlay',
    hasAudio && mode === 'read' ? 'reader-overlay--with-player' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={overlayClass} role="dialog" aria-label={`Reading ${displayName}`}>

      {/* ── Top bar — three zones: left | center | right ── */}
      <div className="reader-topbar">

        {/* LEFT: home button, TOC toggle, chapter + page */}
        <div className="reader-topbar-left">
          <button className="reader-home-btn" onClick={closeBook} title="Back to library (Esc)">
            <HobbitDoor size={30} />
          </button>
          {mode === 'read' && (
            <button className="reader-btn reader-toc-toggle"
              onClick={() => setShowToc(s => !s)} title="Table of contents">☰</button>
          )}
          {mode === 'read' && (chapterTitle || pageInSection > 0) && (
            <div className="reader-location">
              {chapterTitle && <span className="reader-location-chapter">{chapterTitle}</span>}
              {pageInSection > 0 && (
                <span className="reader-location-page">p.{pageInSection}/{pagesInSection}</span>
              )}
            </div>
          )}
        </div>

        {/* CENTER: book title + author, bigger, centered over the text */}
        <div className="reader-title-block">
          <span className="reader-title">{displayName}</span>
          {file.author && <span className="reader-author">{file.author}</span>}
        </div>

        {/* RIGHT: mode toggle, font size, close */}
        <div className="reader-topbar-right">
          {hasAudio && (
            <button
              className={`reader-btn reader-mode-btn${mode === 'listen' ? ' reader-mode-btn--active' : ''}`}
              onClick={() => setMode(m => m === 'read' ? 'listen' : 'read')}
              title={mode === 'read' ? 'Switch to Listen mode' : 'Switch to Read mode'}
            >
              {mode === 'read' ? '🎧 Listen' : '📖 Read'}
            </button>
          )}
          {mode === 'read' && (
            <>
              <button className="reader-btn" onClick={() => adjustFontSize(-10)} title="Smaller">A−</button>
              <button className="reader-btn reader-btn-larger" onClick={() => adjustFontSize(10)} title="Larger">A+</button>
            </>
          )}
          <button className="reader-btn reader-close-btn" onClick={closeBook} title="Close (Esc)">✕</button>
        </div>

      </div>

      {/* ── Read mode ── */}
      {mode === 'read' && (
        <div className="reader-body">
          {showToc && (
            <div className="reader-toc-panel">
              <div className="reader-toc-header">Contents</div>
              {toc.length === 0 && <div className="reader-toc-empty">No chapters found</div>}
              {toc.map((item, i) => (
                <TocEntry key={i} item={item} onSelect={goToHref} depth={0} />
              ))}
            </div>
          )}

          <div className="reader-reading-area">
            <div className="reader-reading-column">
              <button
                className={`reader-nav reader-nav-prev${atStart ? ' reader-nav-disabled' : ''}`}
                onClick={() => renditionRef.current?.prev()}
                aria-label="Previous chapter"
              >‹</button>

              <div ref={wrapperRef} className="reader-content-wrapper">
                {isLoading && !error && (
                  <div className="reader-loading">
                    <div className="reader-spinner" />
                    <span>{loadingMsg}</span>
                  </div>
                )}
                {error && (
                  <div className="reader-error">
                    <p>Couldn't open this book.</p>
                    <p className="reader-error-detail">{error}</p>
                    <button className="reader-btn" onClick={closeBook}>Close</button>
                  </div>
                )}
                <div ref={containerRef} className="reader-content" />
              </div>

              <button
                className={`reader-nav reader-nav-next${atEnd ? ' reader-nav-disabled' : ''}`}
                onClick={() => renditionRef.current?.next()}
                aria-label="Next chapter"
              >›</button>
            </div>
          </div>

          <div className="reader-bottombar">
            <div className="reader-progress-track">
              <div className="reader-progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="reader-progress-label">
              {progress > 0 ? `${Math.round(progress * 100)}%` : '…'}
            </span>
          </div>
        </div>
      )}

      {/* ── Listen mode ── */}
      {mode === 'listen' && (
        <ListenMode isPlayingBook={isPlaying} />
      )}
    </div>
  );
}

/* Walk the TOC tree to find the label for the current spine href */
function findChapterTitle(items: NavItem[], href: string): string | null {
  for (const item of items) {
    if (item.href) {
      const base = item.href.split('#')[0];
      if (base && (href === base || href.endsWith('/' + base) || base.endsWith('/' + href))) {
        return item.label.trim();
      }
    }
    if (item.subitems?.length) {
      const found = findChapterTitle(item.subitems, href);
      if (found) return found;
    }
  }
  return null;
}

/* ─────────────────────────────────────────────────────── */
/*  Listen Mode — Spotify-style full-screen audio player  */
/* ─────────────────────────────────────────────────────── */

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function ListenMode({ isPlayingBook }: { isPlayingBook: boolean }) {
  const {
    currentFile, playlist, playlistIndex,
    isPlaying, currentTime, duration, speed,
    play, pause, resume, seek, setSpeed, nextChapter, prevChapter,
  } = usePlayer();

  if (!currentFile) {
    return (
      <div className="listen-mode listen-mode--empty">
        <div className="listen-empty-icon">🎧</div>
        <p className="listen-empty-text">No audio loaded</p>
        <p className="listen-empty-sub">Play an audio chapter from your library, then come back here.</p>
      </div>
    );
  }

  const coverUrl = currentFile.coverPath ? `${BASE}/files/${currentFile.id}/cover` : null;
  const bookName = currentFile.collectionName ?? currentFile.title ?? currentFile.name;
  const pct      = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="listen-mode">
      {/* Cover art */}
      <div className="listen-cover-wrap">
        {coverUrl
          ? <img className="listen-cover" src={coverUrl} alt={bookName} />
          : <div className="listen-cover-placeholder">♪</div>
        }
      </div>

      {/* Title + chapter label */}
      <div className="listen-info">
        <div className="listen-book-title">{bookName}</div>
        {currentFile.author && <div className="listen-author">{currentFile.author}</div>}
        {playlist.length > 1 && (
          <div className="listen-chapter-label">
            {currentFile.title ?? currentFile.name}
            <span className="listen-chapter-of"> · Ch. {playlistIndex + 1}/{playlist.length}</span>
          </div>
        )}
      </div>

      {/* Scrubber */}
      <div className="listen-scrub-area">
        <span className="listen-time">{fmt(currentTime)}</span>
        <input
          type="range"
          className="listen-scrubber"
          min={0} max={duration || 1} value={currentTime}
          style={{ '--progress': `${pct * 100}%` } as React.CSSProperties}
          onChange={e => seek(Number(e.target.value))}
        />
        <span className="listen-time">{fmt(duration)}</span>
      </div>

      {/* Controls */}
      <div className="listen-controls">
        <button
          className="listen-ctrl-btn"
          onClick={prevChapter}
          disabled={playlistIndex === 0}
          title="Previous chapter"
        >⏮</button>

        <button className="listen-ctrl-btn" onClick={() => seek(currentTime - 30)} title="Back 30s">
          <span>⏪</span><span className="listen-skip-label">30</span>
        </button>

        <button
          className="listen-play-btn"
          onClick={isPlaying ? pause : resume}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button className="listen-ctrl-btn" onClick={() => seek(currentTime + 30)} title="Forward 30s">
          <span className="listen-skip-label">30</span><span>⏩</span>
        </button>

        <button
          className="listen-ctrl-btn"
          onClick={nextChapter}
          disabled={playlistIndex >= playlist.length - 1}
          title="Next chapter"
        >⏭</button>
      </div>

      {/* Speed */}
      <div className="listen-speed-row">
        {[0.75, 1, 1.25, 1.5, 2].map(r => (
          <button
            key={r}
            className={`listen-speed-btn${speed === r ? ' listen-speed-btn--active' : ''}`}
            onClick={() => setSpeed(r)}
          >{r}×</button>
        ))}
      </div>

      {/* Chapter list */}
      {playlist.length > 1 && (
        <div className="listen-chapter-list">
          {playlist.map((f, i) => (
            <button
              key={f.id}
              className={`listen-chapter-row${i === playlistIndex ? ' listen-chapter-row--active' : ''}`}
              onClick={() => play(f, playlist)}
            >
              <span className="listen-ch-num">{i + 1}</span>
              <span className="listen-ch-name">{f.title ?? f.name}</span>
              {i === playlistIndex && <span className="listen-ch-playing">▶</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── */
/*  TOC helper  */
/* ───────────── */

function TocEntry({ item, onSelect, depth }: { item: NavItem; onSelect: (href: string) => void; depth: number }) {
  return (
    <>
      <button className="reader-toc-item"
        style={{ paddingLeft: `${1 + depth}rem` }}
        onClick={() => onSelect(item.href)}>
        {item.label.trim()}
      </button>
      {item.subitems?.map((sub, i) => (
        <TocEntry key={i} item={sub} onSelect={onSelect} depth={depth + 1} />
      ))}
    </>
  );
}

/* ───────────────── */
/*  Root wrapper    */
/* ───────────────── */

export function ReaderWrapper() {
  const { currentBook } = useReader();
  if (!currentBook) return null;
  return <Reader file={currentBook} />;
}
