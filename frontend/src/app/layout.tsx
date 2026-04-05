import type { Metadata } from "next";
import "./globals.css";
import ToastWrapper from "@/components/ui/ToastWrapper";
import ThemeInit from "@/components/layout/ThemeInit";

export const metadata: Metadata = {
  title: "LifeOps Copilot — AI-Powered Student Productivity",
  description: "Manage your inbox, career, calendar, and budget with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = 'dark';
                  var raw = localStorage.getItem('lifeops-state') || localStorage.getItem('sparkup-state');
                  if (raw) {
                    var s = JSON.parse(raw);
                    if (s.theme === 'light' || s.theme === 'dark') theme = s.theme;
                  } else {
                    var t = localStorage.getItem('lifeops-theme') || localStorage.getItem('sparkup-theme');
                    if (t === 'light' || t === 'dark') theme = t;
                  }
                  document.documentElement.className = theme + ' h-full';
                  document.documentElement.style.colorScheme = theme;
                } catch(e) {
                  document.documentElement.className = 'dark h-full';
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeInit />
        {children}
        <ToastWrapper />
      </body>
    </html>
  );
}
