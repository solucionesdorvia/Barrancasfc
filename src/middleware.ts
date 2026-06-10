import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/uploadthing(.*)",
  "/api/health(.*)",
  "/invite/(.*)",
  "/api/invitations/by-token/(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublic(req)) {
    auth().protect();
  }
  // Inyectamos el pathname como header para que server components y layouts
  // puedan leer la URL actual sin hacks (no hay API estable para esto en
  // Next 14 App Router). Lo usa por ej /padre/layout.tsx para no renderizar
  // el chrome del portal cuando el usuario está en /padre/onboarding.
  const res = NextResponse.next();
  res.headers.set("x-pathname", req.nextUrl.pathname);
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
