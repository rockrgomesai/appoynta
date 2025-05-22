import "dotenv/config";
import { db } from "@/lib/db";
import { menuItems, roles, menuItemRoles } from "@/db/schema";

async function seedMenuItems() {
  try {
    // Insert menu items
    const menuItemIds = await db.insert(menuItems).values([
      { label: "Dashboard", href: "/dashboard", permission: "manage_dashboard", order: 1 },
      { label: "Manage Users", href: "/users", permission: "manage_users", order: 2 },
      { label: "Departments", href: "/departments", permission: "manage_reports", order: 3 },
      { label: "Designations", href: "/designations", permission: "manage_designations", order: 4 },
      { label: "Visitors", href: "/visitors", permission: "manage_visitors", order: 5 },
    ]).returning({ id: menuItems.id });


    // Map menu items to roles
    await db.insert(menuItemRoles).values([
      { menuItemId: menuItemIds[0].id, role_id: 1 }, // Dashboard -> Admin
      { menuItemId: menuItemIds[0].id, role_id: 1 }, // Dashboard -> Manager
      { menuItemId: menuItemIds[1].id, role_id: 1 }, // Manage Users -> Admin
      { menuItemId: menuItemIds[2].id, role_id: 1 }, // Reports -> Manager
      { menuItemId: menuItemIds[3].id, role_id: 1 }, // Settings -> Super Admin
      { menuItemId: menuItemIds[4].id, role_id: 1 }, // Profile -> User
    ]);

    console.log("Menu items and roles seeded successfully!");
  } catch (error) {
    console.error("Error seeding menu items and roles:", error);
  }
}

seedMenuItems();