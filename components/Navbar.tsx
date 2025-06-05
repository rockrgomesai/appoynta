"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null); // State to store the username
  const router = useRouter();

  useEffect(() => {
    try {
      // Fetch the user object from localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser); // Parse the user object
        setUsername(user.username); // Extract and set the username
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      // Clear invalid data from localStorage
      localStorage.removeItem("user");
    }
  }, []);

  const handleLogout = () => {
    // Perform logout logic here (e.g., clear tokens, call logout API)
    console.log("Logging out...");
    localStorage.removeItem("token"); // Clear token from localStorage
    localStorage.removeItem("user"); // Clear user object from localStorage
    router.push("/login"); // Redirect to login page after logout
  };

  return (
    <header className="w-full h-16 bg-white text-black flex items-center px-4 justify-between shadow-lg z-50 relative">
      {/* App Title */}
      <h1 className="text-2xl  text-blue-700 font-bold">Appoynta</h1>

      {/* Avatar and Dropdown */}
      <div className="relative">
        {/* Avatar Placeholder */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white focus:outline-none"
        >
          {/* Placeholder Avatar */}
          <span className="text-sm font-bold">A</span>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg">
            <ul className="py-1">
              {/* Username */}
              {username && (
                <li className="px-4 py-2 text-gray-700 font-semibold border-b">
                  {username}
                </li>
              )}
              {/* Logout */}
              <li>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}