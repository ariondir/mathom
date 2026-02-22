import { HobbitDoorHero } from './HobbitDoorHero';

interface Props {
  onAdd: () => void;
  adding: boolean;
}

export function ShireScene({ onAdd, adding }: Props) {
  return (
    <div className="shire-scene-hero">
      {/* Tagline overlaid on the sky portion of the door image */}
      <div className="shire-door-wrap">
        <HobbitDoorHero />
        <p className="shire-tagline shire-tagline--overlay">
          Your hobbit hole awaits, dear friend.
        </p>
      </div>

      <p className="shire-sub">
        A <em>mathom</em> is anything too good to throw away —
        a book, a song, a tale worth keeping in the Shire.
      </p>
      <div className="shire-hints">
        <span className="shire-hint">📖 EPUBs &amp; PDFs</span>
        <span className="shire-hint-sep">·</span>
        <span className="shire-hint">🎧 Audiobooks &amp; Music</span>
        <span className="shire-hint-sep">·</span>
        <span className="shire-hint">🎬 Videos</span>
      </div>
      <button className="btn-primary btn-hero" onClick={onAdd} disabled={adding}>
        {adding ? 'Adding…' : '+ Add Mathoms'}
      </button>
    </div>
  );
}
