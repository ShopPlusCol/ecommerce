export type AdminRole =
  | "owner"
  | "admin"
  | "operations"
  | "content_editor"
  | "read_only_analyst";

export type Permission = `${string}:${string}`;

export function can(
  roles: readonly string[],
  permissions: readonly Permission[],
  resource: string,
  action: string,
) {
  if (roles.includes("owner")) return true;
  return permissions.includes(`${resource}:${action}`);
}
