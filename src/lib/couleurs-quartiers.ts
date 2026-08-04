export const COULEURS_QUARTIERS = [
  "emerald",
  "sky",
  "amber",
  "violet",
  "rose",
  "teal",
  "orange",
  "blue",
] as const;

export type CouleurQuartier = (typeof COULEURS_QUARTIERS)[number];

export const TINTE: Record<CouleurQuartier, string> = {
  emerald: "rgba(5, 150, 105, 0.07)",
  sky: "rgba(2, 132, 199, 0.07)",
  amber: "rgba(217, 119, 6, 0.07)",
  violet: "rgba(124, 58, 237, 0.07)",
  rose: "rgba(225, 29, 72, 0.07)",
  teal: "rgba(13, 148, 136, 0.07)",
  orange: "rgba(234, 88, 12, 0.07)",
  blue: "rgba(37, 99, 235, 0.07)",
};

export const BORDES: Record<CouleurQuartier, string> = {
  emerald: "border-emerald-600/40",
  sky: "border-sky-600/40",
  amber: "border-amber-600/40",
  violet: "border-violet-600/40",
  rose: "border-rose-600/40",
  teal: "border-teal-600/40",
  orange: "border-orange-600/40",
  blue: "border-blue-600/40",
};

export const PUCES_BORDURE: Record<CouleurQuartier, string> = {
  emerald: "border-emerald-600/50",
  sky: "border-sky-600/50",
  amber: "border-amber-600/50",
  violet: "border-violet-600/50",
  rose: "border-rose-600/50",
  teal: "border-teal-600/50",
  orange: "border-orange-600/50",
  blue: "border-blue-600/50",
};

export const CHIPS: Record<CouleurQuartier, string> = {
  emerald: "border-emerald-600/40 bg-emerald-600/10 text-emerald-800",
  sky: "border-sky-600/40 bg-sky-600/10 text-sky-800",
  amber: "border-amber-600/40 bg-amber-600/10 text-amber-800",
  violet: "border-violet-600/40 bg-violet-600/10 text-violet-800",
  rose: "border-rose-600/40 bg-rose-600/10 text-rose-800",
  teal: "border-teal-600/40 bg-teal-600/10 text-teal-800",
  orange: "border-orange-600/40 bg-orange-600/10 text-orange-800",
  blue: "border-blue-600/40 bg-blue-600/10 text-blue-800",
};

export const FILLS: Record<CouleurQuartier, string> = {
  emerald: "rgba(5, 150, 105, 0.16)",
  sky: "rgba(2, 132, 199, 0.16)",
  amber: "rgba(217, 119, 6, 0.16)",
  violet: "rgba(124, 58, 237, 0.16)",
  rose: "rgba(225, 29, 72, 0.16)",
  teal: "rgba(13, 148, 136, 0.16)",
  orange: "rgba(234, 88, 12, 0.16)",
  blue: "rgba(37, 99, 235, 0.16)",
};

export const STROKES: Record<CouleurQuartier, string> = {
  emerald: "#059669",
  sky: "#0284c7",
  amber: "#d97706",
  violet: "#7c3aed",
  rose: "#e11d48",
  teal: "#0d9488",
  orange: "#ea580c",
  blue: "#2563eb",
};

export const TEXTES: Record<CouleurQuartier, string> = {
  emerald: "#065f46",
  sky: "#075985",
  amber: "#92400e",
  violet: "#5b21b6",
  rose: "#9f1239",
  teal: "#115e59",
  orange: "#c2410c",
  blue: "#1e40af",
};
