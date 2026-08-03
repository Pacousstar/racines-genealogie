import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Généalogie Toa-Zéo",
    template: "%s · Généalogie Toa-Zéo",
  },
  description:
    "L'arbre du village Toa-Zéo — table de généalogie pilotée par le CHO Tahidi Denis DIHI.",
  applicationName: "Généalogie Toa-Zéo",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}