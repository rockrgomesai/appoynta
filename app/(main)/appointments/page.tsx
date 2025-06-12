import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import AppointmentsClient from "./AppointmentsClient";
import { cookies } from "next/headers";

export default async function AppointmentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:appointments")) redirect("/403");

  return <AppointmentsClient user={user} permissions={permissions} />;
}