import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { LookupForm } from "./lookup-form";

export const metadata: Metadata = { title: "Consultar mi pedido" };
export default function TrackOrderPage() {
  return <>
    <PageHeader title="Consultar mi pedido" description="Usa el número y código privado entregados al finalizar la compra." />
    <Section spacing="sm"><Container narrow><LookupForm /></Container></Section>
  </>;
}
