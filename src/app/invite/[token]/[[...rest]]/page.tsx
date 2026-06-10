import Image from "next/image";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { AlertCircle, ArrowRight } from "lucide-react";
import type { Invitation } from "@prisma/client";
import { lookupInvitation, INVITATION_FAILURE_LABEL } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESOR: "Profesor / DT",
  PADRE: "Padre / tutor",
};

export default async function InvitePage({ params }: { params: { token: string; rest?: string[] } }) {
  const { userId } = auth();
  const result = await lookupInvitation(params.token);

  // Shell oscuro común a las 3 vistas (válida / inválida / ya logueado)
  return (
    <main className="min-h-dvh bg-gradient-to-br from-barrancas-dark via-zinc-950 to-zinc-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-32 h-96 w-96 bg-barrancas-red/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-96 w-96 bg-red-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-6 py-10 flex flex-col items-center">
        <Image src="/logo.png" alt="Barrancas FC" width={80} height={106} priority className="mb-6 drop-shadow-2xl" />

        {!result.ok ? (
          <InvalidCard reason={result.reason} />
        ) : (
          <ValidContent
            invitation={result.invitation}
            alreadyLogged={!!userId}
            token={params.token}
          />
        )}
      </div>
    </main>
  );
}

function InvalidCard({ reason }: { reason: "not_found" | "revoked" | "expired" | "used" }) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-6 w-full text-center space-y-3">
      <div className="mx-auto h-12 w-12 rounded-full bg-red-500/20 grid place-items-center">
        <AlertCircle className="h-6 w-6 text-red-300" />
      </div>
      <h1 className="text-lg font-bold">Invitación no disponible</h1>
      <p className="text-sm text-zinc-400">{INVITATION_FAILURE_LABEL[reason]}</p>
      <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white mt-2">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}

async function ValidContent({
  invitation,
  alreadyLogged,
  token,
}: {
  invitation: Invitation;
  alreadyLogged: boolean;
  token: string;
}) {
  // Datos legibles para mostrar
  const [club, categories, children] = await Promise.all([
    prisma.club.findUnique({ where: { id: invitation.clubId }, select: { name: true } }),
    invitation.categoryIds.length
      ? prisma.category.findMany({ where: { id: { in: invitation.categoryIds } }, select: { name: true } })
      : [],
    invitation.childrenIds.length
      ? prisma.player.findMany({ where: { id: { in: invitation.childrenIds } }, select: { firstName: true, lastName: true } })
      : [],
  ]);

  const contextLine =
    invitation.role === "PROFESOR" && categories.length
      ? `a cargo de ${categories.map((c) => c.name).join(", ")}`
      : invitation.role === "PADRE" && children.length
      ? `para ver a ${children.map((c) => c.firstName).join(", ")}`
      : "";

  return (
    <div className="w-full space-y-5">
      <div className="bg-white/5 border border-white/10 backdrop-blur rounded-2xl p-5 text-center space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">Invitación a {club?.name ?? "Barrancas FC"}</p>
        <h1 className="text-2xl font-bold">
          Te invitaron como <span className="text-barrancas-red">{ROLE_LABEL[invitation.role]}</span>
        </h1>
        {invitation.title && <p className="text-sm text-zinc-300">{invitation.title}</p>}
        {contextLine && <p className="text-sm text-zinc-400">{contextLine}</p>}
      </div>

      {alreadyLogged ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center space-y-3">
          <p className="text-sm">Ya tenés sesión iniciada en Clerk.</p>
          <Button asChild className="w-full bg-barrancas-red hover:bg-barrancas-red/90 gap-2">
            <Link href={`/invite/${token}/accept`}>
              Aceptar invitación <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex justify-center">
          {/* Clerk hace path routing para verify-email-address y sub-pasos.
              Necesitamos `path` explícito + una catch-all sibling route
              (/invite/[token]/[[...rest]]/page.tsx) que renderea este mismo
              componente, así verify-email-address cae bien. */}
          <SignUp
            routing="path"
            path={`/invite/${token}`}
            forceRedirectUrl={`/invite/${token}/accept`}
            signInForceRedirectUrl={`/invite/${token}/accept`}
            initialValues={invitation.email ? { emailAddress: invitation.email } : undefined}
            appearance={{ variables: { colorPrimary: "#C8102E" } }}
          />
        </div>
      )}

      <p className="text-[10px] text-zinc-500 text-center">
        Este link es personal. Expira el{" "}
        {new Date(invitation.expiresAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long" })}.
      </p>
    </div>
  );
}
