import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Synap — Real-Time Visual Intelligence for Learning",
  description:
    "Learn anything through live AI-powered sessions with real-time visual explanations, diagrams, and personalized teaching. Your intelligent learning companion.",
  keywords: [
    "AI tutor",
    "real-time learning",
    "visual intelligence",
    "live session",
    "AI education",
    "personalized learning",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-geist-sans)]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
