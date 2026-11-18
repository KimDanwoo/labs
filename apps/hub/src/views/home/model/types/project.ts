export interface Project {
  title: string;
  description?: string;
  href: string;
  scope?: readonly string[];
  image?: string;
  imagePosition?: 'top' | 'center';
}
