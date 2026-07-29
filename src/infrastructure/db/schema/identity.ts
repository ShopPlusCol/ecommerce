import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { idColumn, timestampColumns } from "./_helpers";

/** Sección 30: administradores, roles, permisos y sesiones. */
export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: idColumn(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
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

export const sessions = sqliteTable(
  "sessions",
  {
    id: idColumn(),
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("sessions_token_idx").on(table.token),
    index("sessions_user_idx").on(table.userId),
  ],
);

/** Credenciales administradas por Better Auth; nunca se guardan en sesiones. */
export const authAccounts = sqliteTable(
  "auth_accounts",
  {
    id: idColumn(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("auth_accounts_provider_account_idx").on(table.providerId, table.accountId),
    index("auth_accounts_user_idx").on(table.userId),
  ],
);

/** Tokens de recuperación/verificación de un solo uso de Better Auth. */
export const authVerifications = sqliteTable(
  "auth_verifications",
  {
    id: idColumn(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ...timestampColumns,
  },
  (table) => [index("auth_verifications_identifier_idx").on(table.identifier)],
);

/** Rate limiting persistente, apto para procesos múltiples y Cloudflare D1. */
export const authRateLimits = sqliteTable(
  "auth_rate_limits",
  {
    id: idColumn(),
    key: text("key").notNull(),
    count: integer("count").notNull(),
    lastRequest: integer("last_request").notNull(),
  },
  (table) => [uniqueIndex("auth_rate_limits_key_idx").on(table.key)],
);

/** Bloqueo temporal por identidad además del límite por IP de Better Auth. */
export const authLoginAttempts = sqliteTable(
  "auth_login_attempts",
  {
    id: idColumn(),
    identityKey: text("identity_key").notNull(),
    failedCount: integer("failed_count").notNull().default(0),
    lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
    lastAttemptAt: integer("last_attempt_at", { mode: "timestamp_ms" }).notNull(),
    ...timestampColumns,
  },
  (table) => [uniqueIndex("auth_login_attempts_identity_idx").on(table.identityKey)],
);
