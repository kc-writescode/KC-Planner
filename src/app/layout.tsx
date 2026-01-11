import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Perfect Planner - Your Day, Organized",
  description: "A comprehensive planner for day planning, task management, time blocking, and more. Sync with Google and Apple Calendar.",
  keywords: ["planner", "calendar", "tasks", "productivity", "time blocking", "habits"],
  authors: [{ name: "Perfect Planner" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
