import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { Providers } from '@/providers/Providers';
import { Noto_Sans_KR } from 'next/font/google';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={notoSansKr.className}>
        <Providers>
          <Header />
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
