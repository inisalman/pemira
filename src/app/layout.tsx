import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pemira E-Voting | Poltekkes Kemenkes Jakarta 1",
  description:
    "Platform pemungutan suara elektronik untuk pemilihan ketua dan wakil ketua organisasi mahasiswa Poltekkes Kemenkes Jakarta 1.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-base">
        <a href="#main-content" className="skip-link">
          Langsung ke konten utama
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
