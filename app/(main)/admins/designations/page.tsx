import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";
import DesignationsClient from "./DesignationsClient";
import { cookies } from "next/headers";

export default async function DepartmentsPage() {
  console.log((await cookies()).getAll());
  const user = await getSessionUser();
  if (!user) redirect("/403");
  const permissions = await getPermissionsForRole(user.role_id);
  if (!permissions.includes("page:designations")) redirect("/403");

  return <DesignationsClient user={user} permissions={permissions} />;
}