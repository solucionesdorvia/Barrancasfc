import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones · NEXCLUB",
  description: "Términos y condiciones de uso de la plataforma NEXCLUB.",
};

// Última revisión: 2026-06-19. Si actualizás los términos, cambiá la fecha
// abajo y guardá la versión anterior en /legal/terms/history para auditoría.
const LAST_UPDATED = "19 de junio de 2026";

export default function TermsPage() {
  return (
    <>
      <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
        Legal · NEXCLUB
      </p>
      <h1>Términos y Condiciones</h1>
      <p className="text-sm text-nex-muted -mt-4">Última actualización: {LAST_UPDATED}</p>

      <h2>1. Aceptación</h2>
      <p>
        Al crear una cuenta, acceder o utilizar la plataforma NEXCLUB (en adelante,{" "}
        <strong>la Plataforma</strong>) usted acepta estos Términos y Condiciones (en adelante,{" "}
        <strong>los Términos</strong>). Si no está de acuerdo, no use la Plataforma.
      </p>
      <p>
        La Plataforma es operada por <strong>Dorvia</strong> (en adelante,{" "}
        <strong>NEXCLUB</strong> o <strong>nosotros</strong>), con domicilio en Buenos Aires,
        República Argentina.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        NEXCLUB es una plataforma SaaS de gestión integral para clubes deportivos —principalmente
        de fútbol formativo argentino— que permite administrar padrón de jugadores, cuotas,
        comunicación con familias, asistencia, documentos médicos y eventos. Cada club contrata
        una instancia con su propio subdominio (por ejemplo,{" "}
        <code>nombredelclub.nexclub.app</code>).
      </p>

      <h2>3. Tipos de cuenta</h2>
      <ul>
        <li>
          <strong>Administrador del club:</strong> usuario designado por el club para gestionar
          el padrón, cuotas, comunicación y configuración del tenant.
        </li>
        <li>
          <strong>Profesor/Entrenador:</strong> usuario con acceso a una o más categorías para
          tomar asistencia y gestionar su grupo.
        </li>
        <li>
          <strong>Padre / Tutor:</strong> usuario familiar de uno o más jugadores, con acceso
          a su estado de cuenta, documentos y comunicaciones del club.
        </li>
      </ul>
      <p>
        El alta y baja de usuarios la administra el club. NEXCLUB no es responsable por accesos
        otorgados o revocados por el club.
      </p>

      <h2>4. Datos de menores de edad</h2>
      <p>
        Dado que la Plataforma se utiliza para gestionar la actividad deportiva de menores de
        edad, el club es responsable de obtener el <strong>consentimiento informado de los
        padres o tutores</strong> de cada jugador menor de 18 años antes de cargar sus datos.
        NEXCLUB actúa como encargado del tratamiento conforme a la Ley 25.326 de Protección de
        Datos Personales.
      </p>
      <p>
        Las fotos, documentos médicos y datos sensibles cargados sólo son accesibles por los
        usuarios autorizados del club y la familia correspondiente.
      </p>

      <h2>5. Pagos</h2>
      <p>
        La Plataforma integra con <strong>MercadoPago</strong> para el cobro de cuotas y
        servicios del club. NEXCLUB <strong>no procesa ni retiene fondos</strong>: cada pago va
        directamente a la cuenta MercadoPago del club. Las comisiones, plazos y condiciones de
        liquidación las define MercadoPago.
      </p>
      <p>
        El club es responsable de emitir comprobantes y cumplir con las obligaciones fiscales
        que correspondan (ej. inscripción ARCA, facturación, retenciones).
      </p>
      <p>
        El uso de la Plataforma puede tener un costo de suscripción mensual o anual abonado
        por el club a NEXCLUB. Las condiciones específicas se acuerdan en el contrato comercial
        firmado entre las partes.
      </p>

      <h2>6. Propiedad de los datos</h2>
      <p>
        El club es <strong>dueño absoluto</strong> de los datos cargados (jugadores, padres,
        pagos, asistencias, documentos). NEXCLUB se compromete a:
      </p>
      <ul>
        <li>
          Proveer una herramienta de exportación completa (CSV o similar) ante solicitud del
          administrador del club.
        </li>
        <li>
          Devolver todos los datos y eliminarlos de nuestros sistemas en un plazo máximo de{" "}
          <strong>30 días</strong> tras la baja del servicio, salvo obligación legal de retención.
        </li>
        <li>No vender, ceder ni utilizar los datos del club para fines ajenos al servicio.</li>
      </ul>

      <h2>7. Disponibilidad y mantenimiento</h2>
      <p>
        Nos esforzamos por mantener la Plataforma disponible 24/7, pero no garantizamos un SLA
        del 100%. Podemos realizar tareas de mantenimiento programado con aviso previo, o
        intervenciones de emergencia sin aviso si están en juego la integridad de los datos.
      </p>
      <p>
        NEXCLUB no es responsable por interrupciones causadas por terceros (proveedores de
        hosting, MercadoPago, registradores de dominio, ISPs, etc.).
      </p>

      <h2>8. Uso aceptable</h2>
      <p>El usuario se compromete a no:</p>
      <ul>
        <li>Cargar datos falsos, ofensivos, discriminatorios o que infrinjan derechos de terceros.</li>
        <li>Usar la Plataforma para fines ajenos a la gestión del club.</li>
        <li>
          Intentar acceder a tenants ajenos, hacer ingeniería inversa, scraping masivo o
          ataques de denegación de servicio.
        </li>
        <li>
          Compartir credenciales o permitir el acceso de personas no autorizadas por el club.
        </li>
      </ul>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, NEXCLUB no será responsable por daños
        indirectos, lucro cesante, pérdida de oportunidad o daños punitivos. La responsabilidad
        máxima de NEXCLUB hacia el club, por cualquier causa, no excederá el monto pagado por
        el club en los últimos 12 meses.
      </p>

      <h2>10. Modificaciones</h2>
      <p>
        Podemos actualizar estos Términos. Las modificaciones materiales se notificarán al
        administrador del club por email con al menos 30 días de anticipación. El uso continuado
        de la Plataforma implica aceptación de los nuevos términos.
      </p>

      <h2>11. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de la República Argentina. Cualquier controversia
        se someterá a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, con
        renuncia expresa a cualquier otro fuero.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos Términos, escribinos a{" "}
        <a href="mailto:hola@nexclub.app">hola@nexclub.app</a>.
      </p>
    </>
  );
}
