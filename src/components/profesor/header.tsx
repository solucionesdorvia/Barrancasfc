import { UserButton } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand-logo";

export function ProfesorHeader({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="flex items-center justify-between h-14 px-4 md:px-8 max-w-5xl mx-auto">
        <BrandLogo />
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-sm font-medium">{userName}</span>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        </div>
      </div>
    </header>
  );
}
