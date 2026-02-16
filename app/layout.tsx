import type { Metadata } from "next";
import "./globals.css";
import { SubmissionModal } from "@/components/SubmissionModal";

export const metadata: Metadata = {
  title: "Sting Sales Sprint",
  description: "1-week gamified sales competition"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <SubmissionModal />
      </body>
    </html>
  );
}
