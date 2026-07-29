import { Chip } from "@/components/ui/chip";

/**
 * Marca honesta para acciones comerciales que existen visualmente en la
 * Fase 1 (para validar diseño y recorrido) pero cuya lógica real -carrito
 * persistente, checkout, pagos- se conecta en las fases 2 y 3. Evita
 * botones que aparenten funcionar sin hacerlo.
 */
export function PhaseNotice({ phase = 2 }: { phase?: number }) {
  return <Chip variant="info">Disponible en la Fase {phase}</Chip>;
}
