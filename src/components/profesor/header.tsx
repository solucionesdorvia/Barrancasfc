"use client";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export function ProfesorHeader({
  userName,
  clubName,
  logoUrl,
}: {
  userName: string;
  clubName?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between h-14 px-4 md:px-8 max-w-5xl mx-auto">
        <BrandLogo clubName={clubName} logoUrl={logoUrl} />
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-sm font-medium">{userName}</span>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          <SignOutButton>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
