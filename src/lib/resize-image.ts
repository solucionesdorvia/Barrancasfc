/**
 * Reduce una imagen a max NxN JPEG. Devuelve un dataURL listo para enviar
 * al servidor. Pesa ~20-30 KB típico con maxSize=400 — entra cómodo en
 * columnas `photo` de Player/User sin depender de un bucket externo.
 *
 * Requiere DOM (canvas) — solo se llama desde client components.
 */
export async function resizeImageToDataUrl(
  file: File,
  maxSize = 400,
  quality = 0.8
): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("No se pudo decodificar la imagen"));
    i.src = dataUrl;
  });
  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
