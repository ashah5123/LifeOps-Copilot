import type { Metadata } from "next";
import "./globals.css";
import ToastWrapper from "@/components/ui/ToastWrapper";

export const metadata: Metadata = {
  title: "LifeOps — AI-Powered Student Productivity",
  description: "Manage your inbox, career, calendar, and budget with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <ToastWrapper />
      </body>
    </html>
  );
}
