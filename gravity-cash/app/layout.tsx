import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Gravity Cash',
  description: 'Physics‑based web app for earning points by tapping floating coins',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-primary-500">Gravity Cash</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <Link href="/store" className="hover:underline">Store</Link>
            <Link href="/history" className="hover:underline">History</Link>
          </nav>
          {/* Placeholder for live point balance */}
          <div className="text-primary-600 font-medium">Points: <span id="point-balance">0</span></div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto p-4">
          {children}
        </main>
        <footer className="text-center text-xs py-2 border-t border-gray-200 dark:border-gray-700">
          © {new Date().getFullYear()} Gravity Cash. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
