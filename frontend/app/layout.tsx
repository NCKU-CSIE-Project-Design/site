import React from 'react';
import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from './ClientLayout';
import { GoogleAnalytics } from '@next/third-parties/google';
import MicrosoftClarity from './MicrosoftClarity';

export const metadata: Metadata = {
  title: "Korean Personal Color Analytics",
  description: "Upload your photo or take a picture, and let AI create personalized color recommendations for you",
  icons: {
    icon: '/favicon.ico'
  },
};

export const themeConfig = {
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
    fontFamily: '"Noto Sans TC", sans-serif',
  },
}; 

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics gaId="G-L6XX689XJQ" />
        <MicrosoftClarity clarityId="rgbmrq1m4h" />
      </head>
      <body className="antialiased">
        <ClientLayout themeConfig={themeConfig}>{children}</ClientLayout>
      </body>
    </html>
  );
}
