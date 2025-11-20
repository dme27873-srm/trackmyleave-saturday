import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Leave Calendar Manager',
  description: 'Manage your Saturday holidays and leave days',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
