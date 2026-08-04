/**
 * Qué PageView ya se emitió: la ruta y si en ese momento había
 * consentimiento de marketing (es decir, si Meta llegó a recibirlo).
 */
export type PageViewMark = { path: string; marketing: boolean };

export type PageViewInput = {
  path: string;
  consentDecided: boolean;
  analytics: boolean;
  marketing: boolean;
  /** Último PageView emitido, o `null` si todavía no se emitió ninguno. */
  last: PageViewMark | null;
};

/**
 * Decide si corresponde emitir un PageView.
 *
 * Existe como función pura porque las reglas son sutiles y se rompían solas
 * dentro de un `useEffect`: antes el efecto dependía de `consent.analytics`,
 * así que quien aceptaba solo marketing no generaba ninguna vista, y quien
 * ya tenía una preferencia guardada generaba dos al hidratar (una con el
 * estado inicial y otra al llegar el valor real).
 *
 * Reglas:
 * - Nada antes de que la persona decida.
 * - Nada si no aceptó ni analítica ni marketing.
 * - Una sola vez por ruta.
 * - Excepción: si la vista anterior de esta misma ruta se emitió sin
 *   consentimiento de marketing y ahora sí lo hay, se emite otra vez — es la
 *   única forma de que Meta reciba la vista de la página en la que la
 *   persona acaba de aceptar. Al revés (marketing que se revoca) no se
 *   reemite nada.
 */
export function shouldEmitPageView(input: PageViewInput): boolean {
  if (!input.consentDecided) return false;
  if (!input.analytics && !input.marketing) return false;
  if (!input.last) return true;
  if (input.last.path !== input.path) return true;
  return !input.last.marketing && input.marketing;
}
