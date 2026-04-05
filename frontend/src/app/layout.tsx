import type { Metadata } from "next";
import "./globals.css";
import ToastWrapper from "@/components/ui/ToastWrapper";

export const metadata: Metadata = {
  title: "SparkUp — AI-Powered Student Productivity",
  description: "Manage your inbox, career, calendar, and budget with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('sparkup-theme') || 'dark';
                  document.documentElement.className = theme + ' h-full';
                } catch(e) {
                  document.documentElement.className = 'dark h-full';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <ToastWrapper />
      </body>
    </html>
  );
}
