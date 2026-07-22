import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('javashare-theme');document.documentElement.dataset.theme=t==='dark'||t==='light'?t:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const s=Number(localStorage.getItem('javashare-font-scale'));if(s>=1&&s<=1.45)document.documentElement.style.setProperty('--ui-scale',String(s))}catch(e){}` }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
