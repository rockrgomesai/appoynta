import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import UsersClient from "./UsersClient";
import { cookies } from "next/headers";

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:users")) redirect("/403");

  return <UsersClient user={user} permissions={permissions} />;
}