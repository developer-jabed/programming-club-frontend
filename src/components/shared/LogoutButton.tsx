"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { logoutUser } from "@/service/auth/logoutUser";

interface LogoutButtonProps {
  onLogoutSuccess?: () => void;
}

const LogoutButton = ({ onLogoutSuccess }: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to logout?")) return;

    setIsLoading(true);
    try {
      await logoutUser();
      onLogoutSuccess?.(); // ← This clears the navbar state
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-3 px-6 py-3.5 text-red-600 hover:bg-red-50 w-full text-left rounded-b-3xl transition-colors"
    >
      <LogOut size={18} />
      <span className="font-medium">
        {isLoading ? "Logging out..." : "Logout"}
      </span>
    </button>
  );
};

export default LogoutButton;
