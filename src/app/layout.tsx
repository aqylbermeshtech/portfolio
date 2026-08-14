import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import NoiseBackground from "@/components/NoiseBackground";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "noorturin — Portfolio",
  description: "Junior student at SDU, building things on the side.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="relative min-h-full overflow-hidden">
        <NoiseBackground />
        <main className="relative mx-auto max-w-2xl px-[2ch] pt-[3lh] pb-[3lh] sm:px-[7ch] sm:pt-[4lh]">
          {children}
        </main>
      </body>
    </html>
  );
}
