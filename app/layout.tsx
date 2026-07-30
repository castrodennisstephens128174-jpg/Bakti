import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { WalletProvider } from '@/ui/wallet/WalletProvider';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3005'),
  title: {
    default: 'Bakti — a dignified monthly allowance for the parents back home',
    template: '%s · Bakti',
  },
  description:
    'Bakti turns easy-to-forget remittances into a steady monthly allowance for elderly parents. Set the amount and the day once, sign each month on Stellar, and they collect local cash — no smartphone, no crypto needed on their side.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <WalletProvider>
          {children}
          <Toaster richColors position="top-center" />
        </WalletProvider>
      </body>
    </html>
  );
}
