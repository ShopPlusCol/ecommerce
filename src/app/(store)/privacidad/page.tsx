import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getPrivacySettings } from "@/modules/settings/privacy";

export const metadata: Metadata = { title: "Política de privacidad" };

export default async function PrivacyPolicyPage() {
  const privacy = await getPrivacySettings();
  return (
    <>
      <PageHeader title="Política de privacidad" />
      <Section spacing="sm">
        <Container narrow className="prose prose-stone flex max-w-3xl flex-col gap-6">
          <p className="rounded-lg bg-warning-soft p-4 text-sm text-warning">
            Versión técnica {privacy.policyVersion}. Este texto describe el funcionamiento actual de la
            plataforma y debe ser revisado por el responsable legal de ShopPlusCol antes de la
            salida a producción. Estado de revisión:{" "}
            {privacy.legalReviewStatus === "reviewed" ? "revisado por el negocio" : "pendiente"}.
            No constituye asesoría legal.
          </p>

          <section>
            <h2 className="font-display text-2xl">1. Responsable y contacto</h2>
            <p className="text-text-muted">
              {privacy.controllerName} actúa como responsable del tratamiento de los datos usados
              para atender pedidos y solicitudes. Puedes escribir a{" "}
              <a href={`mailto:${privacy.privacyEmail}`}>{privacy.privacyEmail}</a> para consultas
              de privacidad.
              {privacy.legalId ? ` Identificación: ${privacy.legalId}.` : ""}
              {privacy.address ? ` Domicilio: ${privacy.address}.` : ""}
              {!privacy.legalId || !privacy.address
                ? " La identificación o el domicilio definitivos deben completarse durante la revisión legal previa a producción."
                : ""}
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">2. Datos y finalidades</h2>
            <p className="text-text-muted">
              Al realizar un pedido se tratan datos de contacto, entrega, productos, importes,
              método y estado de pago. Se usan para validar inventario y precio, coordinar la
              entrega, atender el pedido, prevenir abuso y conservar trazabilidad operativa. El
              consentimiento de marketing es independiente y opcional.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">3. Cookies, atribución y medición</h2>
            <p className="text-text-muted">
              El carrito, la sesión administrativa, la seguridad y las preferencias de
              consentimiento usan almacenamiento necesario. Los parámetros UTM pueden conservarse
              para atribuir un pedido. La analítica o publicidad de Meta permanece desactivada si
              no está configurada y no debe activarse antes del consentimiento aplicable. Puedes
              cambiar o retirar preferencias desde el banner de consentimiento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">4. Fotografía del simulador</h2>
            <p className="text-text-muted">
              La fotografía seleccionada se procesa dentro de tu navegador para ubicar la textura
              orientativa de los lentes. La tienda no la sube, no la guarda en el servidor, no la
              incorpora a perfiles, no la usa para publicidad ni entrenamiento y no envía rasgos
              biométricos a analítica. Se elimina de la memoria de la página al pulsar “Eliminar
              foto”, cerrar el simulador, recargar o abandonar la página. El modelo de detección se
              descarga desde el proveedor técnico indicado por la aplicación, pero la foto no se
              transmite a ese proveedor.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">5. Proveedores y transferencias</h2>
            <p className="text-text-muted">
              La plataforma está preparada para usar alojamiento, almacenamiento, correo,
              Mercado Pago y Meta. Cada integración solo debe activarse con contrato, configuración
              y credenciales válidas. Los datos compartidos se limitarán a los necesarios para la
              operación solicitada. Actualmente la disponibilidad real de cada proveedor puede
              consultarse al responsable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">6. Conservación y seguridad</h2>
            <p className="text-text-muted">
              Las fotos del simulador no tienen retención en servidor. Los contadores técnicos
              contra abuso expiran con su ventana. La configuración operativa actual conserva
              pedidos durante {privacy.orderRetentionMonths} meses, comprobantes durante{" "}
              {privacy.proofRetentionMonths} meses y auditoría durante {privacy.auditRetentionMonths}{" "}
              meses, salvo que una obligación aplicable exija otro plazo. Estos plazos deben ser
              validados por el responsable antes de producción. Se aplican controles de acceso,
              registros de auditoría, validación de archivos, copias de seguridad y cifrado en
              tránsito en los entornos desplegados.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">7. Derechos del titular</h2>
            <p className="text-text-muted">
              Puedes solicitar acceso, actualización, corrección, exportación o eliminación cuando
              corresponda, retirar el consentimiento de marketing y presentar consultas o reclamos
              mediante el correo de contacto. Para protegerte, podremos pedir información mínima
              que permita verificar la identidad y localizar los registros, sin solicitar
              contraseñas ni datos completos de pago.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">8. Cambios</h2>
            <p className="text-text-muted">
              Los pedidos registran la versión aceptada de términos y privacidad. Cuando exista un
              cambio material, se publicará una nueva versión y se solicitará una aceptación nueva
              cuando sea necesario.
            </p>
          </section>
        </Container>
      </Section>
    </>
  );
}
