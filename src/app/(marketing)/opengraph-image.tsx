import { ImageResponse } from "next/og";

/**
 * OG image dinámica para la landing. Next.js la sirve en
 * `/_next/image?og=` cuando el crawler pide `og:image`.
 *
 * Tokens duros porque el SVG-runtime de ImageResponse no resuelve
 * CSS vars de Tailwind.
 */
export const runtime = "edge";
export const alt = "NEXCLUB · El sistema operativo de tu club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NEX_INK = "#14211C";
const NEX_PRIMARY = "#0F766E";
const NEX_SOFT = "#D7F0E8";
const NEX_MUTED = "#4B5A54";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, #EFFAF5 0%, ${NEX_SOFT} 100%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Wordmark dos colores arriba a la izquierda */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: -1,
              color: NEX_INK,
            }}
          >
            NEX
          </span>
          <span
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: -1,
              color: NEX_PRIMARY,
            }}
          >
            CLUB
          </span>
        </div>

        {/* Hero copy abajo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: -3,
              color: NEX_INK,
              lineHeight: 1.02,
              maxWidth: 1000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>El club entero,</span>
            <span style={{ color: NEX_PRIMARY, fontStyle: "italic" }}>
              en una pantalla.
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: NEX_MUTED,
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            Padrón, cuotas y comunicación con las familias. Hecho para clubes de
            deportivos argentinos.
          </div>
        </div>

        {/* Pie con dominio */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: NEX_MUTED,
            borderTop: `1px solid ${NEX_PRIMARY}33`,
            paddingTop: 24,
          }}
        >
          <span>nexclub.app</span>
          <span style={{ color: NEX_INK, fontWeight: 600 }}>
            Ya gestiona Barrancas FC
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
