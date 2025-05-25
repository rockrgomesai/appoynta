export interface MenuItem {
  id: number;
  label: string;
  href: string;
  permission: string;
  order: number;
  menuicon?: string;
  parent_id?: number | null;
  is_submenu: boolean;
  children?: MenuItem[];
}