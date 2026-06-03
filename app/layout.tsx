import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Todo Tracker",
  description: "Personal todo tracker — list and infinite-canvas board views"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <TopNav showAuthControls={Boolean(session)} />
        {children}
      </body>
    </html>
  );
}
