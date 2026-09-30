import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARVESTI — Студия кавказских танцев',
  description: 'Личный кабинет учениц и руководителя ARVESTI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ARVESTI',
  },
  applicationName: 'ARVESTI',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ARVESTI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="bg-neutral-950 text-neutral-100 min-h-screen flex flex-col antialiased selection:bg-white selection:text-black">
        <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 pb-24">
          {children}
        </main>
      </body>
    </html>
  );
}
