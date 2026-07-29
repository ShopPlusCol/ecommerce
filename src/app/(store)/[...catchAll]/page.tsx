import { notFound } from "next/navigation";

/**
 * Captura cualquier ruta no reconocida dentro de la tienda para que se
 * muestre el 404 con el header/footer de la marca (app/(store)/not-found.tsx)
 * en lugar del 404 genérico de la raíz.
 */
export default function StoreCatchAll() {
  notFound();
}
