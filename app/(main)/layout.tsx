import React from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar roleId={1}/>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto">{children}</main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}