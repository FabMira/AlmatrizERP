/**
 * Client-side Excel parser for MASTER contabilidad xlsx workbooks.
 *
 * Each function receives a raw 2-D array (RawRow[]) produced by:
 *   XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true })
 *
 * Returns records ready to be sent to bulkImportAccountingAction.
 */

export type RawRow = unknown[];

// ── Month helpers ──────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEPT", "OCT", "NOV", "DIC",
];

function monthISO(year: number, monthIdx: number): string {
  return `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;
}

// ── Value converters ──────────────────────────────────────────────────────────

/** Excel date serial → ISO yyyy-mm-dd string */
function excelSerialToISO(serial: number): string | null {
  if (!serial || isNaN(serial) || serial < 1) return null;
  // Excel epoch bug: 1900 was not a leap year but Excel treats it as one
  const epoch = Date.UTC(1899, 11, 30); // Dec 30, 1899
  const date = new Date(epoch + Math.floor(serial) * 86_400_000);
  return date.toISOString().slice(0, 10);
}

/** "DD-MM-YYYY" or "DD/MM/YYYY" → "YYYY-MM-DD" */
function parseDateString(s: string): string | null {
  const m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s.trim());
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function toDate(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "number") return excelSerialToISO(val);
  if (typeof val === "string") return parseDateString(val);
  return null;
}

function toAmount(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return Math.round(val);
  if (typeof val === "string") {
    // Remove $ . (thousands sep) space; replace , with .
    const n = parseFloat(val.replace(/[$.\s]/g, "").replace(",", "."));
    return Math.round(isNaN(n) ? 0 : n);
  }
  return 0;
}

function str(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

// ── Borrar → acc_journal ───────────────────────────────────────────────────────
// Row 3 (idx 2) = headers: Fecha | Descripción | N° Doc. | Cargos | Abonos | Saldo
// Data from row 4 (idx 3)

export function parseBorrar(rows: RawRow[]): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i];
    const fecha = toDate(r[0]);
    if (!fecha) continue;
    const descripcion = str(r[1]);
    if (!descripcion) continue;
    result.push({
      fecha,
      descripcion,
      n_doc: str(r[2]) || null,
      cargos: Math.abs(toAmount(r[3])),
      abonos: Math.abs(toAmount(r[4])),
      saldo: toAmount(r[5]),
    });
  }
  return result;
}

// ── Cart → acc_history ─────────────────────────────────────────────────────────
// Row 2 (idx 1) = headers: Fecha | Descripción | Sucursal | N° Doc. | Cargos | Abonos | Saldo
// Data from row 3 (idx 2)

export function parseCart(rows: RawRow[]): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const fecha = toDate(r[0]);
    if (!fecha) continue;
    const descripcion = str(r[1]);
    if (!descripcion) continue;
    result.push({
      fecha,
      descripcion,
      sucursal: str(r[2]) || null,
      n_doc: str(r[3]) || null,
      cargos: Math.abs(toAmount(r[4])),
      abonos: Math.abs(toAmount(r[5])),
      saldo: toAmount(r[6]),
    });
  }
  return result;
}

// ── Transbank → acc_card_sales ─────────────────────────────────────────────────
// Row 2 (idx 1) = headers: Fecha Venta(A) | Local(B) | Id Local(C) | Tipo Mov(D) |
//   Tipo Tarjeta(E) | Id(F) | Tipo Cuota(G) | Monto Afecto(H) | Matrícula(I) |
//   Cod Auth(J) | N° Cuotas(K) | Monto Cuota(L) | Primer Abono(M) | N° Boleta(N) | Monto Vuelto(O)
// Data from row 3 (idx 2)

function mapCardType(code: string): string {
  const c = code.toUpperCase();
  return c === "DB" || c.includes("DEBI") ? "debito" : "credito";
}

function parseCuotas(tipoCuota: string): number {
  // "C3C" → 3, "S/C" → 1, "" → 1
  const m = /C(\d+)C/i.exec(tipoCuota);
  return m ? parseInt(m[1]) : 1;
}

export function parseTransbank(rows: RawRow[]): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const fecha_venta = toDate(r[0]);
    if (!fecha_venta) continue;
    const monto_bruto = toAmount(r[7]); // Monto Afecto (col H)
    if (monto_bruto === 0) continue;
    const tipo_tarjeta = mapCardType(str(r[4]));
    const cuotas = parseCuotas(str(r[6]));
    const fecha_pago = toDate(r[12]) ?? null; // Primer Abono (col M)
    result.push({
      fecha_venta,
      local: str(r[2]) || str(r[1]), // Identificación Local, fallback to Local
      tipo_tarjeta,
      monto_bruto,
      comision: 0,
      monto_neto: monto_bruto,
      cuotas,
      fecha_pago,
      estado: "pagado",
    });
  }
  return result;
}

// ── EscV25 / EscV26 → acc_program_payments ────────────────────────────────────
// Row 7 (idx 6) = headers: …Nombre(B) | ENE(C) … DIC(N) | Total | Plan | …
// Data from row 8 (idx 7): A=index, B=alumna_nombre, C-N=monthly amounts

export function parseProgramPayments(
  rows: RawRow[],
  programa: string,
  year: number,
  headerRowIdx = 6,   // 0-indexed (row 7)
  dataStartIdx = 7,   // 0-indexed (row 8)
  nameColIdx = 1,     // col B
  firstMonthColIdx = 2 // col C = ENE
): Record<string, unknown>[] {
  void headerRowIdx; // used only as documentation; layout is fixed
  const result: Record<string, unknown>[] = [];
  for (let i = dataStartIdx; i < rows.length; i++) {
    const r = rows[i];
    const alumna_nombre = str(r[nameColIdx]);
    if (!alumna_nombre) continue;
    // Skip summary/total rows
    if (/total|subtotal/i.test(alumna_nombre)) continue;

    for (let m = 0; m < 12; m++) {
      const monto = toAmount(r[firstMonthColIdx + m]);
      if (monto <= 0) continue;
      result.push({
        programa,
        alumna_nombre,
        alumna_email: null,
        concepto: `Cuota ${MONTH_LABELS[m]}`,
        monto,
        fecha_pago: monthISO(year, m),
        metodo_pago: "transferencia",
        estado: "pagado",
        mes: MONTH_LABELS[m].toLowerCase(),
        notas: null,
      });
    }
  }
  return result;
}

// ── F Cont → acc_program_payments ─────────────────────────────────────────────
// Structure: alternating course-name rows, header rows ("Nombre | ENE | FEB …"),
// and data rows (name in col A, amounts in cols B-M idx 1-12)

export function parseFormacionContinua(rows: RawRow[], year: number): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  let currentCourse = "Formación Continua";

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const colA = str(r[0]);
    const colB = str(r[1]);

    // Skip header rows: col A starts with "Nombre" and col B = "ENE"
    if (/^nombre/i.test(colA) && colB === "ENE") continue;

    // Detect course / section name row: text in col A, no numeric amounts, not a note
    const hasNumericAmount = r.slice(1, 13).some((v) => typeof v === "number" && (v as number) > 0);
    if (!hasNumericAmount) {
      if (
        colA.length > 2 &&
        !colA.startsWith("$") &&
        !/valores|pagos|plan de pago/i.test(colA)
      ) {
        currentCourse = colA;
      }
      continue;
    }

    // Data row: must have a non-empty name in col A
    if (!colA) continue;

    const alumna_nombre = colA;
    for (let m = 0; m < 12; m++) {
      const monto = toAmount(r[m + 1]); // cols B-M (idx 1-12)
      if (monto <= 0) continue;
      result.push({
        programa: "formacion_continua",
        alumna_nombre,
        alumna_email: null,
        concepto: currentCourse,
        monto,
        fecha_pago: monthISO(year, m),
        metodo_pago: "transferencia",
        estado: "pagado",
        mes: MONTH_LABELS[m].toLowerCase(),
        notas: null,
      });
    }
  }
  return result;
}

// ── Gastos → acc_expenses ──────────────────────────────────────────────────────
// Structure: section header rows (col A = category, col B = "ENE"),
// then data rows (col A = name/proveedor, cols B-M = monthly amounts, col N = modalidad)

const CATEGORY_KEYWORDS: [string, string][] = [
  ["sueldo", "sueldos"],
  ["retiro", "retiros_socias"],
  ["iva", "iva_retenciones"],
  ["retenci", "iva_retenciones"],
  ["docencia", "docencia"],
  ["bancari", "banco"],
  ["plataforma", "plataformas"],
  ["publicidad", "publicidad"],
  ["caja chica", "caja_chica"],
  ["otros", "otros"],
  ["admin", "admin"],
  ["contadora", "admin"],
];

function inferCategory(sectionHeader: string): string {
  const h = sectionHeader.toLowerCase();
  for (const [keyword, cat] of CATEGORY_KEYWORDS) {
    if (h.includes(keyword)) return cat;
  }
  return "admin";
}

export function parseGastos(rows: RawRow[], year: number): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  let currentCategory = "admin";

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const colA = str(r[0]);
    const colB = str(r[1]);

    // Detect section headers:
    //  • Standard format:  col A = category name, col B = "ENE"
    //  • Special format:   col A = category name, col B = note text, zero amounts
    //    (e.g. "Plataformas" and "Servicios bancarios" in the real Excel)
    const hasAmount = r.slice(1, 13).some((v) => typeof v === "number" && (v as number) !== 0);

    if (colA && !hasAmount) {
      const inferred = inferCategory(colA);
      if (colB === "ENE" || inferred !== "admin") {
        currentCategory = inferred;
        continue; // header/label rows carry no data — always skip
      }
    }

    // Data rows: string in col A and at least one non-zero number in cols B-M
    if (typeof r[0] !== "string" || !colA) continue;
    if (!hasAmount) continue;

    const descripcion = colA;
    const notas = str(r[13]) || null; // modalidad (col N)

    for (let m = 0; m < 12; m++) {
      const val = r[m + 1]; // cols B-M (idx 1-12)
      if (typeof val !== "number" || val === 0) continue;
      const monto = Math.abs(Math.round(val));
      if (monto === 0) continue;
      result.push({
        fecha: monthISO(year, m),
        descripcion,
        categoria: currentCategory,
        subcategoria: null,
        monto,
        proveedor: descripcion,
        n_doc: null,
        notas,
      });
    }
  }
  return result;
}

// ── Consolidado → acc_monthly_summary ─────────────────────────────────────────
// Layout (0-indexed rows):
//   Row 3  (idx 3): INGRESOS section header in col B
//   Row 4  (idx 3 header): ÍTEM/PERIODO | ENE(C=idx2) … DIC(N=idx13)
//   Rows 4-9  : ingreso line items  col B=categoria, C-N=monthly values
//   Row 10    : "Total Mes" ingresos → skip
//   Row 13    : GASTOS section header
//   Rows 14-23: gasto line items
//   Row 24    : "Total Mes" gastos → skip
//
// We produce one acc_monthly_summary record per (categoria × month) with:
//   • ingreso rows → { total_ingresos: amount, total_gastos: 0, resultado: amount }
//   • gasto rows  → { total_ingresos: 0, total_gastos: amount, resultado: -amount }

export function parseConsolidado(rows: RawRow[], year: number): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  let section: "ingresos" | "gastos" | null = null;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const colB = str(r[1]);

    // Section header detection
    if (/^INGRESOS/i.test(colB)) { section = "ingresos"; continue; }
    if (/^GASTOS/i.test(colB))   { section = "gastos";   continue; }
    if (!section) continue;

    // Skip column-label rows, total rows, blank rows, and separator rows
    if (/ITEM|PERÍODO|PERIODO/i.test(colB))     continue;
    if (/^Total\s*Mes/i.test(colB))             continue;
    if (/^INVERSIONES|^Diferencia/i.test(colB)) continue;
    if (!colB.trim())                            continue;

    const categoria = colB.trim();

    // months: cols C-N = array indices 2-13
    for (let m = 0; m < 12; m++) {
      const val = r[m + 2];
      if (typeof val !== "number" || val === 0) continue;
      const amount = Math.abs(Math.round(val));
      if (amount === 0) continue;

      result.push({
        anio: year,
        mes: m + 1,
        categoria,
        total_ingresos: section === "ingresos" ? amount : 0,
        total_gastos:   section === "gastos"   ? amount : 0,
        resultado:      section === "ingresos" ? amount : -amount,
        notas: null,
      });
    }
  }
  return result;
}

// ── Proyección → acc_budget ───────────────────────────────────────────────────
// Layout (0-indexed rows):
//   Row 1 (idx 1): "INGRESOS" header → B:"enero" … M:"diciembre"
//   Rows 2-8     : ingreso line items  col A=categoria, B-M=monthly estimates
//   Row 10       : "GASTOS" header
//   Rows 11-25   : gasto line items
//
// Months: col B=idx1=enero(m=0) … col M=idx12=diciembre(m=11)
// Only rows with at least one non-zero numeric month value produce records.

export function parseProyeccion(rows: RawRow[], year: number): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const colA = str(r[0]);

    if (!colA) continue;
    if (/^INGRESOS|^GASTOS|^INGRESOS NETOS|^CURSO/i.test(colA)) continue;

    const hasAmount = r.slice(1, 13).some((v) => typeof v === "number" && (v as number) !== 0);
    if (!hasAmount) continue;

    const categoria = colA.trim();

    for (let m = 0; m < 12; m++) {
      const val = r[m + 1]; // B=idx1→enero, …, M=idx12→diciembre
      if (typeof val !== "number" || val === 0) continue;
      const amount = Math.abs(Math.round(val));
      if (amount === 0) continue;

      result.push({
        anio: year,
        mes: m + 1,
        categoria,
        monto_estimado: amount,
        monto_real: null,
        notas: null,
      });
    }
  }
  return result;
}
