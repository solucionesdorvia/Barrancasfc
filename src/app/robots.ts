import type { MetadataRoute } from "next";

/**
 * Mientras el MVP esté en demo, no queremos que se indexen rutas internas.
 * Cuando salgamos a producción real, ajustar a `allow: ["/"]` para la landing
 * y mantener disallow del resto.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/profesor", "/profesor/*", "/padre", "/padre/*", "/sign-in", "/sign-up", "/api", "/invite", "/onboarding"],
      },
    ],
  };
}
