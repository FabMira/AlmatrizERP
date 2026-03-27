export interface Link {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  pinned: boolean;
  created_at: string;
}

export interface NewLinkForm {
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
}

export const EMPTY_LINK_FORM: NewLinkForm = {
  title: "",
  description: "",
  url: "",
  category: "Administración",
  icon: "material-symbols:link-outline",
};
