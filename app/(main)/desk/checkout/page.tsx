"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import { formatDateTime } from "@/utils/BangladeshDateTime";

export default function CheckoutPage() {
  const [badgeId, setBadgeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!badgeId.trim()) {
      toast.error("Please enter a badge ID");
      return;
    }

    setIsLoading(true);

    try {
      const checkOutTime = formatDateTime(new Date());

      await axiosInstance.patch(`/attendance_logs/checkout`, {
        badge_id: badgeId,
        check_out_time: checkOutTime
      });

      toast.success("Visitor checked out successfully");
      setBadgeId("");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to checkout visitor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-500 mb-6 text-center">
          Visitor Checkout
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="badgeId" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Badge ID
            </label>
            <input
              id="badgeId"
              type="text"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter badge ID"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              }`}
          >
            {isLoading ? 'Processing...' : 'Checkout Visitor'}
          </button>
        </form>
      </div>
    </div>
  );
}