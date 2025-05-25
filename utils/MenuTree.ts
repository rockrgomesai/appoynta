import { MenuItem } from '@/types/MenuItem';

export function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<number, MenuItem>();
  const rootItems: MenuItem[] = [];

  // First pass: Create map of all items
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Second pass: Build tree structure
  items.forEach(item => {
    const menuItem = itemMap.get(item.id)!;
    if (item.parent_id && itemMap.has(item.parent_id)) {
      const parent = itemMap.get(item.parent_id)!;
      parent.children?.push(menuItem);
    } else {
      rootItems.push(menuItem);
    }
  });

  // Sort children by order
  const sortMenuItems = (items: MenuItem[]) => {
    items.sort((a, b) => a.order - b.order);
    items.forEach(item => {
      if (item.children?.length) {
        sortMenuItems(item.children);
      }
    });
  };

  sortMenuItems(rootItems);
  return rootItems;
}