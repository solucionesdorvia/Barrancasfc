"use client";
import Link, { type LinkProps } from "next/link";
import { useSearchParams } from "next/navigation";
import { forwardRef } from "react";

/**
 * Link interno del portal del padre que preserva automáticamente el query
 * param `?hijo`. Así cuando el padre tiene varios hijos seleccionados y
 * navega entre páginas (dashboard ↔ pagos ↔ docs ↔ avisos ↔ calendario),
 * mantiene el hijo activo en vez de volver siempre al primero.
 */
type PadreLinkProps = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: React.ReactNode;
  };

export const PadreLink = forwardRef<HTMLAnchorElement, PadreLinkProps>(function PadreLink(
  { href, children, ...rest },
  ref
) {
  const searchParams = useSearchParams();
  const hijo = searchParams.get("hijo");

  let finalHref = href as string;
  if (typeof href === "string" && hijo) {
    const sep = href.includes("?") ? "&" : "?";
    // No duplicar si el href ya trae hijo
    if (!/[?&]hijo=/.test(href)) {
      finalHref = `${href}${sep}hijo=${encodeURIComponent(hijo)}`;
    }
  }

  return (
    <Link ref={ref} href={finalHref} {...rest}>
      {children}
    </Link>
  );
});
