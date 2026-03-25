export type DocStatus = "Activo" | "Licencia" | "Nuevo";

export interface Teacher {
  id: number;
  name: string;
  initials: string;
  subject: string;
  area: string;
  email: string;
  phone: string;
  status: DocStatus;
  bio: string;
}
