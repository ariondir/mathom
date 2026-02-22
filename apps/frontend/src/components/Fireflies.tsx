import { useMemo } from 'react';

interface Firefly {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

export function Fireflies({ count = 14 }: { count?: number }) {
  const flies = useMemo<Firefly[]>(() => {
    // Use a seeded sequence so positions are stable on re-renders
    const seq = (i: number, salt: number) => ((i * 127 + salt * 31) % 97) / 97;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top:      seq(i, 1) * 85,
      left:     seq(i, 2) * 98,
      delay:    seq(i, 3) * 5,
      duration: 3 + seq(i, 4) * 5,
      size:     1.5 + seq(i, 5) * 2,
    }));
  }, [count]);

  return (
    <div className="fireflies" aria-hidden>
      {flies.map((f) => (
        <div
          key={f.id}
          className="firefly"
          style={{
            top:              `${f.top}%`,
            left:             `${f.left}%`,
            width:            `${f.size}px`,
            height:           `${f.size}px`,
            animationDelay:   `${f.delay}s`,
            animationDuration:`${f.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
