export interface Area {
  id: string;
  name: string;
  color: string;
}

export interface Course {
  id: string;
  module: number;
  module_name: string;
  category: string;
  title: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
}
