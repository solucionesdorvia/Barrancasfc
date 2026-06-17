"use client";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export function PadreHeader({
  name,
  clubName,
  logoUrl,
}: {
  name: string;
  clubName?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
        <BrandLogo showText={false} clubName={clubName} logoUrl={logoUrl} />
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium hidden sm:inline mr-1 truncate max-w-[120px]">
            {name}
          </span>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          <SignOutButton>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
