"use client";

import { useActionState } from "react";
import { loginAction, requestPasswordResetAction, type LoginState, type ResetState } from "./actions";

const INITIAL_STATE: LoginState = {};
const INITIAL_RESET: ResetState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL_STATE);
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordResetAction, INITIAL_RESET);

  return (
    <div className="mt-8 space-y-5">
      <form action={action} className="space-y-5">
        <label className="block text-sm font-medium text-text">
          Correo
          <input name="email" type="email" autoComplete="username" required className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-text">
          Contraseña
          <input name="password" type="password" minLength={12} maxLength={128} autoComplete="current-password" required className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2" />
        </label>
        {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="w-full rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">
          {pending ? "Verificando…" : "Ingresar"}
        </button>
      </form>
      <form action={resetAction} className="border-t border-border pt-4">
        <p className="mb-2 text-xs text-text-muted">¿Olvidaste tu contraseña?</p>
        <input name="resetEmail" type="email" placeholder="Correo administrativo" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
        {resetState.message ? <p className="mt-2 text-xs text-text-muted">{resetState.message}</p> : null}
        <button type="submit" disabled={resetPending} className="mt-3 text-sm text-brand underline">{resetPending ? "Solicitando…" : "Solicitar recuperación"}</button>
      </form>
    </div>
  );
}
