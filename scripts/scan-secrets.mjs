import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const trackedFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean)
  .filter((file) => !file.endsWith("package-lock.json"));

const patterns = [
  { label: "clave privada", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: "token GitHub", regex: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/ },
  { label: "token Stripe", regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { label: "token Meta", regex: /\bEAA[A-Za-z0-9]{40,}\b/ },
  {
    label: "secreto asignado",
    regex:
      /\b[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|ACCESS_KEY|PRIVATE_KEY)[A-Z0-9_]*=["']?(?!$|changeme|example|placeholder|test-secret)[^\s"'#]{12,}/,
  },
];

const findings = [];
for (const file of trackedFiles) {
  let content;
  try {
    content = await readFile(file, "utf8");
  } catch {
    continue;
  }
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) findings.push(`${file}:${index + 1} (${pattern.label})`);
    }
  }
}

if (findings.length > 0) {
  console.error(`Posibles secretos detectados:\n${findings.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Revisión completada: ${trackedFiles.length} archivos rastreados, 0 posibles secretos.`);
}
