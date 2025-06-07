import React from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-6 rounded-lg shadow-lg flex flex-col items-center justify-center">
          {children}
        </div>
      </div>

  );
}