/**
 * Constantes globales de marca NEXCLUB.
 *
 * Cualquier valor que el usuario quiera cambiar sin entrar al código (número
 * de WhatsApp comercial, email de contacto, etc.) vive acá.
 */

export const NEXCLUB_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_NEXCLUB_WHATSAPP ?? "5491100000000";

export const NEXCLUB_WHATSAPP_DEMO_URL = `https://wa.me/${NEXCLUB_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola NEXCLUB, me gustaría agendar una demo."
)}`;

export const NEXCLUB_CONTACT_EMAIL = process.env.NEXT_PUBLIC_NEXCLUB_EMAIL ?? "hola@nexclub.app";
