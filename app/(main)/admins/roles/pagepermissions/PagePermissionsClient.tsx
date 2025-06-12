"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

interface Role {
  id: number;
  name: string;
}
interface Permission {
  id: number;
  name: string;
}

interface PagePermissionsClientProps {
  user: any;
  ppermissions: string[];
}

export default function PagePermissionsClient({ user, ppermissions }: PagePermissionsClientProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch roles on mount
  useEffect(() => {
    axiosInstance.get("/roles").then(res => setRoles(res.data.data || []));
  }, []);

  // Fetch permissions and role's permissions when role changes
  useEffect(() => {
    if (!selectedRole) return;
    setLoading(true);
    Promise.all([
      axiosInstance.get("/permissions", { params: { pageSize: 1000 } }),
      axiosInstance.get(`/roles/${selectedRole}/permissions`)
    ])
      .then(([permRes, rolePermRes]) => {
        setPermissions(permRes.data.data || []);
        setRolePermissionIds((rolePermRes.data || []).map((p: any) => p.id));
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load permissions.");
        setLoading(false);
      });
  }, [selectedRole]);

  // Handle checkbox change
  const handleCheckbox = (permissionId: number) => {
    setRolePermissionIds(ids =>
      ids.includes(permissionId)
        ? ids.filter(id => id !== permissionId)
        : [...ids, permissionId]
    );
  };

  // Handle submit (upsert role_permissions)
  const handleSubmit = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await axiosInstance.post(`/roles/${selectedRole}/permissions`, {
        permissionIds: rolePermissionIds,
      });
      toast.success("Permissions updated!");
    } catch (err: any) {
      toast.error("Failed to update permissions.");
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-6xl">
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
            onClick={() => {}}
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
              {permissions.map(item => (
                <label key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rolePermissionIds.includes(item.id)}
                    onChange={() => handleCheckbox(item.id)}
                  />
                  {item.name}
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
