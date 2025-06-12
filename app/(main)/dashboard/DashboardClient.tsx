import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";

export default function DashboardClient({ user, permissions }: any) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Welcome to the dashboard! This is where your main content will go.</p>
    </div>
  );
}
