import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SiteFooter from '@/src/components/SiteFooter';
import SiteHeader from '@/src/components/SiteHeader';
import BackToTop from '@/src/components/BackToTop';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resido - Residence & Real Estate',
  description: 'Real estate listings and agency template.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <BackToTop />
      </body>
    </html>
  );
}
