import { createId } from "@paralleldrive/cuid2";
import { integer } from "drizzle-orm/sqlite-core";
import { text } from "drizzle-orm/sqlite-core";

export const idColumn = () => text("id").primaryKey().$defaultFn(() => createId());

export const timestampColumns = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

/** COP como entero (sección 23.1): nunca decimal, nunca texto libre. */
export const moneyColumn = (name: string) => integer(name).notNull();
