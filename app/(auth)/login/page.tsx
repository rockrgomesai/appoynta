"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type User = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  role_id: number;
  role_name: string;
  telephone: string;
  email: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await axios.post("/api/auth/login", data, { withCredentials: true });
      const { token, user } = response.data;

      // Save token and user object in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // Store user as a JSON string

      // Redirect to the dashboard
      toast.success("Login successful!"); // Show success message
      const redirect = searchParams.get("redirect");
      router.replace(redirect || "/"); // changed here from /main to /
    } catch (error: any) {
      console.error("Login failed:", error);

      // Show error message in a toaster
      if (error.response?.data?.error) {
        toast.error(error.response.data.error); // Show API error message
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      const response = await axios.get<User[]>("/api/users", { 
        params: { page: currentPage, pageSize, search: searchTerm },
        headers: {
          Authorization: `Bearer ${token}`, // Add the Bearer token to the Authorization header
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // If token exists, fetch users or redirect to the desired page
      fetchUsers();
    }
  }, [currentPage, pageSize, searchTerm]);

  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="bg-white w-[400px] h-[300px]  flex flex-col justify-between">
        <div className="flex flex-col items-center mb-8">
          
          <h1 className="text-3xl font-extrabold text-blue-700 mb-1 tracking-tight">Appoynta Login</h1>

        </div>
        {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register("username")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              autoComplete="username"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-2 text-white bg-blue-600 rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
        {/* Optional: Add a footer or links here */}
      </div>
    </div>
  );
}