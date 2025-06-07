import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import RolesClient from "./RolesClient";
import { cookies } from "next/headers";

export default async function RolesPage() {
  console.log((await cookies()).getAll());
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:roles")) redirect("/403");

  return <RolesClient user={user} permissions={permissions} />;
}