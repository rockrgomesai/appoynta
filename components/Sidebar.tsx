'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';

type MenuItem = {
  id: number;
  label: string;
  href: string;
  icon: string | null;
  parentId: number | null;
  order: number;
  isSubmenu: boolean;
  children?: MenuItem[];
};

type SidebarProps = {
  roleId: number;
};

export default function Sidebar({ roleId }: SidebarProps) {
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchMenu = async () => {
      const res = await fetch(`/api/menus?role=${roleId}`);
      const data = await res.json();
      setMenuItems(data);
    };
    fetchMenu();
  }, [roleId]);

  const toggleMenu = (id: number) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderIcon = (icon: string | null) => {
    const LucideIcon = icon && (Icons as any)[icon];
    return LucideIcon ? <LucideIcon className="w-4 h-4 mr-2" /> : null;
  };

  const renderMenu = (items: MenuItem[]) =>
    items.map(item => {
      const isActive = pathname === item.href;
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.id}>
          <div
            className={cn(
              'flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800',
              isActive ? 'bg-gray-200 dark:bg-gray-700 font-medium' : ''
            )}
            onClick={() => hasChildren ? toggleMenu(item.id) : null}
          >
            {hasChildren ? (
              // Parent menu - just a div
              <div className="flex items-center w-full">
                {renderIcon(item.icon)}
                <span>{item.label}</span>
              </div>
            ) : (
              // Child menu - Link component
              <Link
                href={item.href}
                className="flex items-center w-full"
              >
                {renderIcon(item.icon)}
                <span>{item.label}</span>
              </Link>
            )}
            
            {hasChildren && (
              <button
                onClick={() => toggleMenu(item.id)}
                className="ml-2"
              >
                {openMenus[item.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>

          {hasChildren && (
            <div
              className={cn(
                'ml-4 overflow-hidden transition-all',
                openMenus[item.id] ? 'max-h-[1000px]' : 'max-h-0',
                'duration-300 ease-in-out'
              )}
            >
              {renderMenu(item.children!)}
            </div>
          )}
        </div>
      );
    });

  return (
    <aside className="w-64 h-full p-4 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      {renderMenu(menuItems)}
    </aside>
  );
};
