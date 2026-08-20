import type { Metadata } from "next";
import { Prompt, Kanit } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

const kanitFont = Kanit({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "HOV AI Banner Studio - 100% Automated E-Commerce Banner Generator",
  description: "ระบบเจนรูปแบนเนอร์โฆษณาพรีเมียมด้วย AI และ Hermes Agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} ${kanitFont.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
