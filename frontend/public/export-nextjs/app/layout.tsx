import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "CodeFlow Export",
  description: "Static export generated from CodeFlow builder",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
