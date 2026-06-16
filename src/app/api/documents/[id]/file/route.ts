import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * GET /api/documents/[id]/file — sirve el archivo del documento.
 *
 * Necesario porque los docs subidos via UploadDocumentButton se guardan
 * como data URIs (sin bucket externo). Los `<a href="data:...">` con
 * payloads grandes los browsers no los abren bien (límite de URL o
 * bloqueos de seguridad). Acá decodificamos el dataURL y respondemos
 * con el binary + content-type correcto, así el browser lo muestra
 * inline (imagen/PDF) o lo descarga normalmente.
 *
 * Autorización:
 * - Admin: cualquier doc.
 * - Padre: solo si es padre del jugador asociado.
 * - Profesor: por ahora no accede a docs (no es flujo necesario).
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();

  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      player: {
        select: { id: true, parents: { select: { id: true } } },
      },
    },
  });
  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  // Autorización
  if (user.role === "PADRE") {
    const isParent = doc.player.parents.some((p) => p.id === user.id);
    if (!isParent) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  } else if (user.role === "PROFESOR") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  // ADMIN: passthrough

  // Si es URL http(s), redirect simple (no almacenamos binary).
  if (/^https?:\/\//i.test(doc.url)) {
    return NextResponse.redirect(doc.url);
  }

  // dataURI → parsear y servir binario
  const match = doc.url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Formato del documento no soportado" }, { status: 500 });
  }
  const contentType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");

  // Nombre con extensión inferida del content-type para descarga limpia
  const ext = contentType === "application/pdf"
    ? "pdf"
    : contentType.startsWith("image/")
    ? contentType.split("/")[1].replace("jpeg", "jpg")
    : "bin";
  const safeName = doc.name.replace(/[^\w\-. ]+/g, "_");

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // inline para que el browser lo muestre en vez de descargar
      "Content-Disposition": `inline; filename="${safeName}.${ext}"`,
      "Content-Length": String(buffer.length),
      // No cache largo porque podrían rotar — 5min es suficiente
      "Cache-Control": "private, max-age=300",
    },
  });
}
