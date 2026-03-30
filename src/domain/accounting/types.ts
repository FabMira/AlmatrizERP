export type CellType = "text" | "currency" | "date" | "status" | "number";
export type FormFieldType = "text" | "number" | "date" | "select" | "textarea";

export interface ColumnConfig {
  key: string;
  label: string;
  type: CellType;
  sortable?: boolean;
  hiddenOnMobile?: boolean;
  summable?: boolean;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
  formField?: {
    type: FormFieldType;
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
  };
}

export interface SectionConfig {
  slug: string;
  label: string;
  icon: string;
  table: string;
  defaultOrder: string;
  programFilter?: string;
  columns: ColumnConfig[];
  emptyForm: Record<string, unknown>;
}

// ── Entity interfaces ─────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  fecha: string;
  descripcion: string;
  n_doc: string | null;
  cargos: number;
  abonos: number;
  saldo: number;
  created_by: string | null;
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  fecha: string;
  descripcion: string;
  n_doc: string | null;
  cargos: number;
  abonos: number;
  saldo: number;
  sucursal: string;
  created_by: string | null;
  created_at: string;
}

export interface CardSale {
  id: string;
  fecha_venta: string;
  local: string;
  tipo_tarjeta: string;
  monto_bruto: number;
  comision: number;
  monto_neto: number;
  cuotas: number;
  fecha_pago: string | null;
  estado: string;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  fecha: string;
  descripcion: string;
  categoria: string;
  subcategoria: string | null;
  monto: number;
  proveedor: string | null;
  n_doc: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ProgramPayment {
  id: string;
  programa: string;
  alumna_nombre: string;
  alumna_email: string | null;
  concepto: string;
  monto: number;
  fecha_pago: string | null;
  metodo_pago: string;
  estado: string;
  mes: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
}

export interface MonthlySummary {
  id: string;
  anio: number;
  mes: number;
  categoria: string;
  total_ingresos: number;
  total_gastos: number;
  resultado: number;
  notas: string | null;
  created_at: string;
}

export interface BudgetItem {
  id: string;
  anio: number;
  mes: number;
  categoria: string;
  monto_estimado: number;
  monto_real: number | null;
  variacion: number | null;
  notas: string | null;
  created_at: string;
}
