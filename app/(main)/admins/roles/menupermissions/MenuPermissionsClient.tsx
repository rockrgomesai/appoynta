"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

interface Role {
  id: number;
  name: string;
}
interface MenuItem {
  id: number;
  label: string;
  permission: string;
}
interface MenuPermissionsClientProps {
  user: any;
  permissions: string[];
}
export default function MenuPermissionsClient({ user, permissions }: MenuPermissionsClientProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roleMenuItemIds, setRoleMenuItemIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch roles on mount
  useEffect(() => {
    axiosInstance.get("/roles").then(res => setRoles(res.data.data || []));
  }, []);

  // Fetch menu items and role's menu_item_roles when role changes
  useEffect(() => {
    if (!selectedRole) return;
    setLoading(true);
    axiosInstance
      .get(`/menu-item-roles?role_id=${selectedRole}`)
      .then(res => {
        setMenuItems(res.data.data || []);
        setRoleMenuItemIds(
          (res.data.data || [])
            .filter((item: any) => item.selected)
            .map((item: any) => item.id)
        );
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load permissions.");
        setLoading(false);
      });
  }, [selectedRole]);

  // Handle checkbox change
  const handleCheckbox = (menuItemId: number) => {
    setRoleMenuItemIds(ids =>
      ids.includes(menuItemId)
        ? ids.filter(id => id !== menuItemId)
        : [...ids, menuItemId]
    );
  };

  // Handle submit (upsert menu_item_roles)
  const handleSubmit = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await axiosInstance.post("/menu-item-roles/upsert", {
        role_id: selectedRole,
        menu_item_ids: roleMenuItemIds,
      });
      toast.success("Permissions updated!");
    } catch (err: any) {
      toast.error("Failed to update permissions.");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
        {/* Role select */}
        <div className="flex items-center gap-4">
          <label htmlFor="role-select" className="font-medium">
            Select Role:
          </label>
          <select
            id="role-select"
            className="border rounded px-3 py-2 flex-1"
            value={selectedRole ?? ""}
            onChange={e => setSelectedRole(Number(e.target.value))}
          >
            <option value="" disabled>
              -- Choose a role --
            </option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <button
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {}} // OK button is now just for UX, selection triggers below
            disabled={!selectedRole}
            type="button"
          >
            OK
          </button>
        </div>

        {/* Permissions grid */}
        {selectedRole && (
          <div className="mt-10">
            <div className="grid grid-cols-4 gap-4">
              {menuItems.map(item => (
                <label key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={roleMenuItemIds.includes(item.id)}
                    onChange={() => handleCheckbox(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleSubmit}
                disabled={loading}
                type="button"
              >
                {loading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}