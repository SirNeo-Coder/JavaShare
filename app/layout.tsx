import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JavaShare — Collaborative Java Classroom",
  description: "A shared Java coding workspace for students and teachers.",
  openGraph: {
    title: "JavaShare",
    description: "Code together. Learn together.",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "JavaShare collaborative classroom" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JavaShare",
    description: "Code together. Learn together.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
