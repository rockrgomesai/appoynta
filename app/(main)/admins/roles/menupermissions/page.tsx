import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import MenuPermissionsClient from "./MenuPermissionsClient";
import { cookies } from "next/headers";

export default async function DepartmentsPage() {
  console.log((await cookies()).getAll());
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:menupermissions")) redirect("/403");

  return <MenuPermissionsClient user={user} permissions={permissions} />;
}