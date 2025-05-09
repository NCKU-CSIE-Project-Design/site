import React from 'react';
import "./globals.css";
import type { Metadata } from "next";
import ClientLayout from './ClientLayout';

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
      <body className="antialiased">
        <ClientLayout themeConfig={themeConfig}>{children}</ClientLayout>
      </body>
    </html>
  );
}
