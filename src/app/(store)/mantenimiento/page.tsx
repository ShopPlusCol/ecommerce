import type { Metadata } from "next";
import { MaintenanceNotice } from "@/components/store/maintenance-notice";

export const metadata: Metadata = { title: "En mantenimiento" };

export default function MaintenancePage() {
  return <MaintenanceNotice />;
}
