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
      const response = await axios.post("/api/auth/login", data);
      const { token, user } = response.data;

      // Save token and user object in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // Store user as a JSON string

      // Redirect to the dashboard
      toast.success("Login successful!"); // Show success message
      const redirect = searchParams.get("redirect");
      router.replace(redirect || "/main");
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Toaster Component */}
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center">Login</h2>
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-1 text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register("username")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-1 text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}