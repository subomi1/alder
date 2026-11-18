import { Star } from "lucide-react";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  const width = `${(clamped / 5) * 100}%`;
  const icons = [0, 1, 2, 3, 4];
  return (
    <span className="relative inline-block align-middle" aria-label={`${clamped.toFixed(1)} out of 5`}>
      <span className="flex gap-0.5 text-muted/35">
        {icons.map((key) => (
          <Star key={key} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      <span className="absolute top-0 left-0 flex gap-0.5 overflow-hidden text-star" style={{ width }}>
        {icons.map((key) => (
          <Star key={key} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (score: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((score) => {
        const active = score <= value;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            aria-label={`${score} star${score === 1 ? "" : "s"}`}
            onClick={() => onChange(score)}
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-paper-deep"
          >
            <Star
              size={20}
              className={active ? "text-star" : "text-muted/40"}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}
