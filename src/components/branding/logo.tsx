import { cn } from "@/lib/utils";

export default function Logo({
  className,
  alt = "Logo Racines+ — Généalogie Toa-Zéo",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/10",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt={alt}
        className="h-full w-full object-contain"
      />
    </span>
  );
}