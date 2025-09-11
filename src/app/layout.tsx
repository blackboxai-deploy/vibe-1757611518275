import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AudioProvider } from '@/hooks/useAudioContext';
import { SequencerProvider } from '@/hooks/useSequencer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Simple DAW - Digital Audio Workstation',
  description: 'A simple browser-based DAW with virtual piano and step sequencer',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-900 text-white`}
      >
        <AudioProvider>
          <SequencerProvider>
            <main className="min-h-screen">
              {children}
            </main>
          </SequencerProvider>
        </AudioProvider>
      </body>
    </html>
  );
}