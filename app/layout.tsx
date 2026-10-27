import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { TRPCProvider } from "@/trpc/client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

// Display face for headings and prices
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Airbnb Clone",
  description: "Book unique stays across the Philippines.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${fraunces.variable} min-h-screen font-sans`}
        suppressHydrationWarning
      >
        <TRPCProvider>
          <Navbar />
          <main className="pb-24">{children}</main>
        </TRPCProvider>
      </body>
    </html>
  );
}
