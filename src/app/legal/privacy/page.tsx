import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad · NEXCLUB",
  description: "Cómo NEXCLUB recolecta, usa y protege tus datos personales.",
};

const LAST_UPDATED = "19 de junio de 2026";

export default function PrivacyPage() {
  return (
    <>
      <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
        Legal · NEXCLUB
      </p>
      <h1>Política de Privacidad</h1>
      <p className="text-sm text-nex-muted -mt-4">Última actualización: {LAST_UPDATED}</p>

      <p>
        Esta Política describe cómo NEXCLUB (operado por <strong>Dorvia</strong>, Buenos Aires,
        Argentina) recolecta, utiliza, almacena y protege los datos personales de los usuarios
        de la Plataforma <code>nexclub.app</code>.
      </p>

      <h2>1. Datos que recolectamos</h2>
      <h3>Datos de cuenta</h3>
      <ul>
        <li>Email, nombre, apellido, teléfono y foto de perfil (opcional).</li>
        <li>Rol asignado en el club (admin, profesor, padre).</li>
        <li>Categorías asignadas (en caso de profesores).</li>
        <li>Vínculo familiar con uno o más jugadores (en caso de padres).</li>
      </ul>

      <h3>Datos de jugadores (cargados por el club)</h3>
      <ul>
        <li>Nombre, fecha de nacimiento, DNI, foto, categoría, vínculo familiar.</li>
        <li>Datos médicos: apto físico, alergias, contacto de emergencia.</li>
        <li>Datos federativos: ficha AFA, número de afiliado, club anterior.</li>
        <li>Asistencia a entrenamientos y partidos.</li>
      </ul>

      <h3>Datos financieros</h3>
      <ul>
        <li>Historial de cuotas adeudadas y pagadas.</li>
        <li>
          <strong>No almacenamos datos de tarjetas de crédito.</strong> El procesamiento de
          pagos lo realiza MercadoPago bajo su propia política de privacidad.
        </li>
      </ul>

      <h3>Datos técnicos</h3>
      <ul>
        <li>Dirección IP, navegador, sistema operativo, timestamps de acceso.</li>
        <li>
          Cookies estrictamente necesarias para mantener la sesión (autenticación via Clerk).
        </li>
      </ul>

      <h2>2. Finalidad del tratamiento</h2>
      <ul>
        <li>Prestar el servicio de gestión deportiva al club contratante.</li>
        <li>Facilitar la comunicación entre club y familias.</li>
        <li>Procesar pagos a través de MercadoPago.</li>
        <li>Auditoría de seguridad y prevención de fraude.</li>
        <li>Cumplimiento de obligaciones legales.</li>
      </ul>
      <p>
        <strong>No utilizamos tus datos para marketing de terceros.</strong> No vendemos, cedemos
        ni alquilamos tu información personal.
      </p>

      <h2>3. Base legal</h2>
      <p>El tratamiento se basa en:</p>
      <ul>
        <li>
          <strong>Consentimiento</strong> del usuario al crear la cuenta y aceptar estos
          términos.
        </li>
        <li>
          <strong>Ejecución del contrato</strong> con el club, en cuyo nombre tratamos los
          datos como encargados.
        </li>
        <li>
          <strong>Interés legítimo</strong> para mantener la seguridad de la Plataforma.
        </li>
        <li>
          <strong>Cumplimiento legal</strong> conforme a la Ley 25.326 de Protección de Datos
          Personales (Argentina).
        </li>
      </ul>

      <h2>4. Datos de menores de edad</h2>
      <p>
        Los jugadores menores de 18 años son cargados por el club con el{" "}
        <strong>consentimiento informado de sus padres o tutores</strong>. Los datos de menores
        se tratan con especial cuidado:
      </p>
      <ul>
        <li>Solo accesibles por los usuarios autorizados del club y su familia.</li>
        <li>No se comparten con terceros salvo obligación legal.</li>
        <li>
          Los padres pueden solicitar acceso, rectificación o eliminación de los datos de sus
          hijos contactando al club o a NEXCLUB.
        </li>
      </ul>

      <h2>5. Compartición con terceros</h2>
      <p>Compartimos datos estrictamente con:</p>
      <ul>
        <li>
          <strong>Clerk</strong> (autenticación) — almacena email, nombre y credenciales
          encriptadas. Servidores en EE.UU. con cumplimiento SOC 2.
        </li>
        <li>
          <strong>Railway</strong> (hosting de aplicación y base de datos) — servidores en
          EE.UU.
        </li>
        <li>
          <strong>MercadoPago</strong> (procesamiento de pagos) — solo datos necesarios para la
          transacción, conforme a su propia política de privacidad.
        </li>
        <li>
          <strong>Resend</strong> (envío de emails transaccionales) — email del destinatario y
          contenido del mensaje.
        </li>
        <li>
          <strong>UploadThing</strong> (almacenamiento de archivos, opcional) — fotos y
          documentos cargados por usuarios.
        </li>
      </ul>
      <p>
        No transferimos datos a países que no garanticen un nivel adecuado de protección. Los
        proveedores listados cumplen con estándares internacionales (SOC 2, GDPR equivalente).
      </p>

      <h2>6. Plazo de conservación</h2>
      <ul>
        <li>
          <strong>Mientras la cuenta esté activa</strong>: tus datos se conservan para la
          prestación del servicio.
        </li>
        <li>
          <strong>Tras la baja</strong>: hasta 30 días para procesar la eliminación y backups,
          salvo obligación legal de retención más prolongada (ej. obligaciones fiscales).
        </li>
        <li>
          <strong>Datos financieros</strong>: 10 años por exigencias contables y tributarias
          (Ley 24.522, Ley 11.683).
        </li>
      </ul>

      <h2>7. Tus derechos</h2>
      <p>Conforme a la Ley 25.326, podés ejercer en cualquier momento los derechos de:</p>
      <ul>
        <li>
          <strong>Acceso</strong>: solicitar copia de tus datos personales.
        </li>
        <li>
          <strong>Rectificación</strong>: corregir datos inexactos.
        </li>
        <li>
          <strong>Eliminación</strong>: solicitar el borrado de tus datos (salvo obligación
          legal de retención).
        </li>
        <li>
          <strong>Oposición</strong>: oponerte a determinados tratamientos.
        </li>
        <li>
          <strong>Portabilidad</strong>: recibir tus datos en formato estructurado (CSV).
        </li>
      </ul>
      <p>
        Para ejercer estos derechos, escribinos a{" "}
        <a href="mailto:hola@nexclub.app">hola@nexclub.app</a>. Respondemos en un plazo máximo
        de 10 días hábiles.
      </p>
      <p>
        Tenés derecho a presentar reclamos ante la{" "}
        <strong>Agencia de Acceso a la Información Pública</strong> (
        <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">
          argentina.gob.ar/aaip
        </a>
        ).
      </p>

      <h2>8. Seguridad</h2>
      <p>Aplicamos medidas técnicas y organizativas para proteger tus datos:</p>
      <ul>
        <li>Cifrado en tránsito (HTTPS/TLS 1.2+).</li>
        <li>Cifrado en reposo de contraseñas y datos sensibles.</li>
        <li>Aislamiento por tenant (un club no puede acceder a datos de otro).</li>
        <li>Backups automáticos diarios de la base de datos.</li>
        <li>Auditoría de accesos a través del módulo de logs interno.</li>
      </ul>
      <p>
        En caso de incidente de seguridad que pueda afectar tus derechos, notificaremos al
        club afectado en un plazo máximo de 72 horas desde la detección.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Usamos exclusivamente cookies estrictamente necesarias para mantener la sesión del
        usuario (gestionadas por nuestro proveedor de autenticación, Clerk). No usamos cookies
        de marketing, analytics de terceros ni publicidad.
      </p>

      <h2>10. Modificaciones</h2>
      <p>
        Podemos actualizar esta Política. Los cambios materiales se comunicarán por email con
        30 días de anticipación. La versión vigente siempre está disponible en{" "}
        <a href="/legal/privacy">/legal/privacy</a>.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Responsable del tratamiento: <strong>Dorvia</strong> — Buenos Aires, Argentina.
        <br />
        Email: <a href="mailto:hola@nexclub.app">hola@nexclub.app</a>
      </p>
    </>
  );
}
