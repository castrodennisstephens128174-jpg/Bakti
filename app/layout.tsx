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
    default: 'Bakti — plan family support on Stellar',
    template: '%s · Bakti',
  },
  description:
    'A testnet prototype for Filipino workers in Malaysia to plan family support and send verifiable XLM or USDC payments to a recipient Stellar address. Licensed cash-out integration is planned, not connected.',
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
