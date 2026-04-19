import type { Metadata } from "next";
import "./globals.css";
import Chatbot from "@/components/ChatBot";

export const metadata: Metadata = {
  title: "Ho Dinh Tri",
  description:
    "Ho Dinh Tri's portfolio - A Computer Science student passionate about cybersecurity and cloud computing in Ho Chi Minh City",
  icons: {
    icon: "/icon_portfolio.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-24">
      <body className="antialiased">
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
