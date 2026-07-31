export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = {
  status: "idle",
  message: "",
};

export function actionError(error: unknown): AdminActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "No fue posible completar la operación.",
  };
}
