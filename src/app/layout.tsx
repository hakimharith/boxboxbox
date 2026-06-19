import type { Metadata } from "next";
import { Barlow_Condensed, JetBrains_Mono, DM_Sans, Chakra_Petch } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-condensed",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const dmSans = DM_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const chakraPetch = Chakra_Petch({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "BoxBoxBox",
  description: "Endurance race tracker",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${barlowCondensed.variable} ${chakraPetch.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-txt font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
