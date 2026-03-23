import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DomainHunt | AI-Powered Premium Domains",
  description: "Find your next billion-dollar domain using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-accent selection:text-accent-foreground`}
      >
        <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
          {children}
        </main>
        <Toaster 
          theme="dark" 
          toastOptions={{
            style: {
              background: '#151921',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F8FAFC'
            }
          }}
        />
      </body>
    </html>
  );
}
