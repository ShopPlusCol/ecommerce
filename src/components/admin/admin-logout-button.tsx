"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error("No fue posible cerrar la sesión.");
      window.location.assign("/acceso-admin");
    } catch {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void signOut()}
      className="rounded-md p-2 hover:bg-surface-sunken disabled:opacity-50"
      aria-label={pending ? "Cerrando sesión" : "Cerrar sesión"}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
