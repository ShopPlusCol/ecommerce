import Link from "next/link";
import type { BrandSettings } from "@/modules/settings/brand";
import { BrandMark } from "./brand-mark";

function buildFooterColumns(brand: BrandSettings): Array<{ title: string; links: Array<{ href: string; label: string }> }> {
  return [
    {
      title: "Ayuda",
      links: [
        { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
        { href: "/cuidados", label: "Cuidados y guía de uso" },
        { href: "/envios", label: "Envíos y entregas" },
        { href: "/devoluciones", label: "Cambios y devoluciones" },
        { href: "/pedidos/consultar", label: "Consultar mi pedido" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/privacidad", label: "Política de privacidad" },
        { href: "/terminos", label: "Términos y condiciones" },
      ],
    },
    {
      title: "Contacto",
      links: [
        { href: "/contacto", label: "Escríbenos" },
        { href: `mailto:${brand.email}`, label: brand.email },
      ],
    },
  ];
}

export function SiteFooter({ brand }: { brand: BrandSettings }) {
  const footerColumns = buildFooterColumns(brand);
  return (
    <footer className="border-t border-border bg-surface-raised">
      <div className="mx-auto max-w-(--content-max-width) px-[var(--content-padding-x)] py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-lg font-semibold text-text"><BrandMark brand={brand} placement="footer" /></p>
            <p className="mt-2 max-w-[26ch] text-sm text-text-muted">{brand.tagline}</p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-text">{column.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-text-muted hover:text-text">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}. Todos los derechos reservados.</p>
          <p>Medellín, Colombia</p>
        </div>
      </div>
    </footer>
  );
}
