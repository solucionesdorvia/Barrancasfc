"use client";
import { UserButton } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand-logo";

export function PadreHeader({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-30 bg-background border-b">
      <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
        <BrandLogo showText={false} />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium hidden sm:inline">{name}</span>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        </div>
      </div>
    </header>
  );
}
