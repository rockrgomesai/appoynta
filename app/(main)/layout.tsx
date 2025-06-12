import React from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSessionUser } from "@/lib/auth";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar */}
        {user?.role_id !== undefined && <Sidebar roleId={user.role_id} />}

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}