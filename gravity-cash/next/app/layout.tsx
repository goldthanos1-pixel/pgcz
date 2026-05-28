import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gravity Cash - Physics App Tech",
  description: "Touch floating coins in gravity canvas and claim rewards!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-[#0a0e17] text-white flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-neon">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glassmorphism border-b border-white/5 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-black uppercase tracking-widest text-cyan-neon neon-glow-cyan">
                🌌 Gravity Cash
              </span>
            </Link>
            <nav className="flex space-x-6 text-sm font-bold uppercase tracking-wider text-gray-400">
              <Link href="/dashboard" className="hover:text-cyan-neon transition-colors">
                Dashboard
              </Link>
              <Link href="/" className="hover:text-pink-neon transition-colors">
                Logout
              </Link>
            </nav>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
          {children}
        </div>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-white/5 text-xs text-gray-600">
          <p>© 2026 Gravity Cash. Play physics, earn real rewards.</p>
        </footer>
      </body>
    </html>
  );
}
