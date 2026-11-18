import { useState } from "react";
import { cn } from "./cn";

export function ProductImage({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={cn("grid h-full w-full place-items-center bg-ink text-paper", className)}>
        <span className="font-serif text-5xl">{name.slice(0, 1)}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={cn(
        "h-full w-full object-cover outline outline-1 -outline-offset-1 outline-ink/10",
        className,
      )}
    />
  );
}
