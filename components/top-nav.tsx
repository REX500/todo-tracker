"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, List, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  showAuthControls: boolean;
}

export function TopNav({ showAuthControls }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  const active = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-4">
        <Link href="/list" className="font-bold tracking-tight text-sm uppercase">
          todo tracker
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild size="sm" variant={active("/list") ? "secondary" : "ghost"}>
            <Link href="/list">
              <List className="h-4 w-4" />
              List
            </Link>
          </Button>
          <Button asChild size="sm" variant={active("/board") ? "secondary" : "ghost"}>
            <Link href="/board">
              <LayoutGrid className="h-4 w-4" />
              Board
            </Link>
          </Button>
        </nav>
        {showAuthControls && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
