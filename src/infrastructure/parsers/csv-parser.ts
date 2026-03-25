export interface ParsedRow {
  full_name: string;
  phone: string;
  email: string;
  city: string;
  valid: boolean;
  error?: string;
}

export function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstCells = lines[0].split(",").map((c) => c.trim().toLowerCase());
  const hasHeader = firstCells.some((c) => ["nombre", "name", "full_name"].includes(c));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .filter((l) => l.trim())
    .map((line) => {
      const cells: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === "," && !inQuotes) { cells.push(cur.trim()); cur = ""; continue; }
        cur += ch;
      }
      cells.push(cur.trim());

      const [nombre = "", telefono = "", email = "", ciudad = ""] = cells;
      const valid = nombre.trim().length > 0;
      return {
        full_name: nombre.trim(),
        phone: telefono.trim(),
        email: email.trim(),
        city: ciudad.trim(),
        valid,
        error: valid ? undefined : "Nombre requerido",
      };
    });
}
