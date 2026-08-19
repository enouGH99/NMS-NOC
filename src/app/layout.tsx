import type { Metadata } from 'next';
import './globals.css';
import { NmsProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Network Monitoring System (NMS) — NOC Portal',
  description: 'Enterprise Network Operations Center Dashboard & Monitoring System with Material Design 3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Google+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-m3-surface text-m3-on-surface min-h-screen antialiased">
        <NmsProvider>{children}</NmsProvider>
      </body>
    </html>
  );
}
