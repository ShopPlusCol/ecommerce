import type { LucideIcon } from "lucide-react";
import {
  BadgePercent,
  Blocks,
  ClipboardList,
  Cog,
  Gift,
  History,
  LayoutDashboard,
  Layers,
  MapPinned,
  Megaphone,
  Newspaper,
  Package,
  Plug,
  ShoppingCart,
  ScanFace,
  Tags,
  Ticket,
  Users,
  Wallet,
  ChartBar,
  Activity,
  Images,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

/** Agrupación de navegación del panel (sección 22.3), ajustada para usabilidad. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "General",
    items: [{ href: "/admin", label: "Resumen", icon: LayoutDashboard }],
  },
  {
    title: "Ventas",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
      { href: "/admin/pagos", label: "Pagos", icon: Wallet },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/simulador", label: "Simulador", icon: ScanFace },
      { href: "/admin/inventario", label: "Inventario", icon: Layers },
      { href: "/admin/categorias", label: "Categorías", icon: Tags },
      { href: "/admin/colecciones", label: "Colecciones", icon: ShoppingCart },
    ],
  },
  {
    title: "Logística",
    items: [{ href: "/admin/envios", label: "Envíos y zonas", icon: MapPinned }],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promociones", label: "Promociones", icon: BadgePercent },
      { href: "/admin/cupones", label: "Cupones", icon: Ticket },
      { href: "/admin/recompensas", label: "Recompensas", icon: Gift },
      { href: "/admin/popups", label: "Pop-ups", icon: Megaphone },
    ],
  },
  {
    title: "Contenido",
    items: [
      { href: "/admin/editor", label: "Editor visual", icon: Blocks },
      { href: "/admin/contenido", label: "Contenido", icon: Newspaper },
      { href: "/admin/medios", label: "Multimedia", icon: Images },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/analitica", label: "Analítica", icon: ChartBar },
      { href: "/admin/integraciones", label: "Integraciones", icon: Plug },
      { href: "/admin/usuarios", label: "Usuarios y roles", icon: Users },
      { href: "/admin/auditoria", label: "Auditoría", icon: History },
      { href: "/admin/configuracion", label: "Configuración", icon: Cog },
      { href: "/admin/estado", label: "Estado del sistema", icon: Activity },
    ],
  },
];
