import { z } from "zod";

export type ProductCsvRow = { sku: string; name: string; slug: string; price: number; status: "draft" | "active" | "archived" };
export type CsvRejection = { row: number; reason: string };

function splitCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
    else value += char;
  }
  values.push(value.trim());
  return values;
}

const rowSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  price: z.coerce.number().int().nonnegative(),
  status: z.enum(["draft", "active", "archived"]),
});

export function parseProductCsv(source: string) {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = splitCsvLine(lines[0] ?? "").map((header) => header.toLowerCase());
  const required = ["sku", "name", "slug", "price", "status"];
  if (!required.every((header) => headers.includes(header))) {
    return { accepted: [] as ProductCsvRow[], rejected: [{ row: 1, reason: `Encabezados requeridos: ${required.join(", ")}` }] };
  }
  const accepted: ProductCsvRow[] = [];
  const rejected: CsvRejection[] = [];
  const seen = new Set<string>();
  lines.slice(1).forEach((line, index) => {
    const values = splitCsvLine(line);
    const record = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""]));
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) rejected.push({ row: index + 2, reason: parsed.error.issues[0]?.message ?? "Fila inválida" });
    else if (seen.has(parsed.data.sku) || seen.has(parsed.data.slug)) rejected.push({ row: index + 2, reason: "SKU o slug duplicado dentro del archivo." });
    else { accepted.push(parsed.data); seen.add(parsed.data.sku); seen.add(parsed.data.slug); }
  });
  return { accepted, rejected };
}

export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
