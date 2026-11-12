import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Screener – LCA & UI/UX roles",
  description: "Extracts, classifies and ranks resumes against an LCA Consultant role and a UI/UX Design internship, with the evidence behind every score.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
