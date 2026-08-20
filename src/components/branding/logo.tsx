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
      role="img"
      aria-label={alt}
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm ring-1 ring-black/10",
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-3/4 w-3/4"
        aria-hidden="true"
      >
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="52"
          fontWeight="800"
          fill="#ffffff"
        >
          R+
        </text>
      </svg>
    </span>
  );
}