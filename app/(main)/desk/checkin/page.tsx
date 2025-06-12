import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import CheckinClient from "./CheckinClient";
import { cookies } from "next/headers";

export default async function CheckinPage() {
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:checkin")) redirect("/403");

  return <CheckinClient user={user} permissions={permissions} />;
}