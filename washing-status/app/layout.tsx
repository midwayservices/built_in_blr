import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Washing Machines Status',
  description: 'Live status of two washing machines',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

