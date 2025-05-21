import React from 'react';
import type { Metadata } from "next";
import ClientLayout from './components/ClientLayout';
// import { GoogleTagManager } from '@next/third-parties/google';
// import MicrosoftClarity from './components/MicrosoftClarity';
import { Geist, Geist_Mono } from "next/font/google";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Korean Personal Color Analytics",
  description: "Upload your photo or take a picture, and let AI create personalized color recommendations for you",
  icons: {
    icon: '/favicon.ico'
  },
};

const themeConfig = {
  palette: {
    primary: {
      main: '#f67280',
    },
    secondary: {
      main: '#f8b195',
    },
    background: {
      default: '#faf6f6',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans)',
  },
};

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      {/* <GoogleTagManager gtmId="GTM-PRLL7MHX" />
      <MicrosoftClarity clarityId="rgbmrq1m4h" /> */}

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout themeConfig={themeConfig}>{children}</ClientLayout>
      </body>
    </html>
  );
}
