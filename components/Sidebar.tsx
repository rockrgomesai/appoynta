"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import * as Icons from "react-icons/fa6";


export default function Sidebar() {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get("/api/menuitems"); // Replace with your API endpoint
        setMenuItems(response.data);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <aside className="w-64 bg-gray-100 text-gray-800 p-4 flex flex-col">
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {menuItems.map((item: any) => (
            <li key={item.id} className="mb-2 flex items-center">
              <span className="mr-2 text-blue-500">
                {Icons[item.menuicon as keyof typeof Icons] 
                  ? React.createElement(Icons[item.menuicon as keyof typeof Icons], { size: 20 }) 
                  : <Icons.FaHouse />} {/* Fallback to a default icon */}
        
              </span>
              <Link
                href={item.href}
                className="block px-4 py-2 rounded hover:bg-gray-300"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}