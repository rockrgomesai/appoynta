import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import VisitorsClient from "./VisitorsClient";
import { cookies } from "next/headers";

export default async function VisitorsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:visitors")) redirect("/403");

  return <VisitorsClient user={user} permissions={permissions} />;
}