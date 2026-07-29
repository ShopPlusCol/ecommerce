import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";

/** Sección 30: administradores, roles, permisos y sesiones. */
export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: idColumn(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("admin_users_email_idx").on(table.email)],
);

export const roles = sqliteTable(
  "roles",
  {
    id: idColumn(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isSystemRole: integer("is_system_role", { mode: "boolean" }).notNull().default(false),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("roles_slug_idx").on(table.slug)],
);

export const permissions = sqliteTable(
  "permissions",
  {
    id: idColumn(),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    description: text("description"),
  },
  (table) => [uniqueIndex("permissions_resource_action_idx").on(table.resource, table.action)],
);

export const rolePermissions = sqliteTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("role_permissions_pk_idx").on(table.roleId, table.permissionId)],
);

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("user_roles_pk_idx").on(table.userId, table.roleId)],
);

export const sessions = sqliteTable("sessions", {
  id: idColumn(),
  userId: text("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
