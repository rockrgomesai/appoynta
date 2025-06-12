import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import DashboardClient from "./DashboardClient";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:dashboard")) redirect("/403");

  return <DashboardClient user={user} permissions={permissions} />;
}