import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChoreChart - AI-Powered Family Chore Management",
  description: "Create structure, accountability, and rewards for your family with AI-powered chore management. Separate interfaces for parents and children with smart insights and flexible reward systems.",
  keywords: ["chores", "family", "kids", "parents", "rewards", "AI", "management", "accountability"],
  authors: [{ name: "ChoreChart Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
