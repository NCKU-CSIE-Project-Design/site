'use client';

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

interface ThemeConfig {
  palette: {
    primary: {
      main: string;
    };
    secondary: {
      main: string;
    };
    background: {
      default: string;
    };
  };
  typography: {
    fontFamily: string;
  };
}

interface ClientLayoutProps {
  children: React.ReactNode;
  themeConfig: ThemeConfig;
}

export default function ClientLayout({ children, themeConfig }: ClientLayoutProps) {
  const theme = createTheme(themeConfig);
  
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
} 