
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button 
          onClick={resetErrorBoundary}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error('Application Error:', error);
      }}
    >
      <ThemeProvider defaultTheme="light" storageKey="ud-news-theme">
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );

  // Initialize Google Analytics (gtag) in production if VITE_GA_ID is set
  (function initAnalytics(){
    try {
      // @ts-ignore
      const GA_ID = (import.meta as any)?.env?.VITE_GA_ID as string | undefined;
      if (!import.meta.env.PROD || !GA_ID) return;
      // Load gtag.js
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
      script.onerror = () => console.warn('Failed to load gtag.js');
      document.head.appendChild(script);

      // Init gtag
      const inline = document.createElement('script');
      inline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { anonymize_ip: true });
      `;
      document.head.appendChild(inline);
    } catch (e) {
      console.warn('Analytics init failed:', e);
    }
  })();

  // Register Service Worker for PWA (only in production and if supported)
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed:', err));
    });
  }
} else {
  console.error('Root container not found');
}
