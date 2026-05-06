import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin", "latin-ext"],
  display: 'swap'
});

export const metadata: Metadata = {
  title: "MİLLİ TEKNOLOJİ ZİRVESİ 2026",
  description: "Savunma Sanayii ve Teknoloji Delege Portalı | ASELSAN - BAYKAR Vizyonu",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MTZ Zirve",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} bg-[#0a0f1e] text-white min-h-screen relative overflow-x-hidden selection:bg-primary/30`}>
        {/* Professional Background Elements */}
        <div className="fixed inset-0 tech-grid pointer-events-none opacity-20" />
        <div className="fixed inset-0 bg-radial-gradient from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Animated Scanning Line (Subtle Background Effect) */}
        <div className="fixed top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan-line pointer-events-none" />

        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
