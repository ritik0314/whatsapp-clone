import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import { logoutUser } from "../../services/user.service";
import useUserStore from "../../store/useUserStore";
import Layout from "../../components/Layout";
import {
  FaComment,
  FaMoon,
  FaQuestionCircle,
  FaSearch,
  FaSignOutAlt,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const Setting = () => {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  const toggleThemeDialog = () => {
    setIsThemeDialogOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("Logged out successfully");
      navigate("/user-login");
    } catch (error) {
      console.error("Failed to logout", error);
      toast.error("Logout failed");
    }
  };

  return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex w-full ${
          theme === "dark"
            ? "bg-[rgb(17,27,33)] text-white"
            : "bg-white text-black"
        }`}
      >
        {/* LEFT PANEL */}
        <div
          className={`w-[400px] border-r ${
            theme === "dark" ? "border-gray-600" : "border-gray-200"
          }`}
        >
          {/* Header */}
          <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Settings</h1>

            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search settings"
                className={`w-full pl-10 p-2 rounded ${
                  theme === "dark"
                    ? "bg-[#202c33] text-white"
                    : "bg-gray-100 text-black"
                }`}
              />
            </div>

            {/* User card */}
            <div
              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer mb-4 ${
                theme === "dark"
                  ? "hover:bg-[#202c33]"
                  : "hover:bg-gray-100"
              }`}
            >
              <img
                src={user?.profilePicture || "/default-avatar.png"}
                alt="profile"
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <h2 className="font-semibold">{user?.username}</h2>
                <p className="text-sm text-gray-400">{user?.about}</p>
              </div>
            </div>

            {/* Menu */}
            <div className="space-y-1">
              {[
                { icon: FaUser, label: "Account", href: "/user-profile" },
                { icon: FaComment, label: "Chats", href: "/" },
                { icon: FaQuestionCircle, label: "Help", href: "/help" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`flex items-center gap-3 p-3 rounded ${
                    theme === "dark"
                      ? "hover:bg-[#202c33]"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="border-b border-gray-200 dark:border-gray-700 w-full py-2">
                    {item.label}
                  </span>
                </Link>
              ))}

              {/* Theme */}
              <button
                onClick={toggleThemeDialog}
                className={`w-full flex items-center gap-3 p-3 rounded ${
                  theme === "dark"
                    ? "hover:bg-[#202c33]"
                    : "hover:bg-gray-100"
                }`}
              >
                {theme === "dark" ? (
                  <FaMoon className="h-5 w-5" />
                ) : (
                  <FaSun className="h-5 w-5" />
                )}
                <div className="flex justify-between w-full border-b border-gray-200 dark:border-gray-700 py-2">
                  <span>Theme</span>
                  <span className="text-sm text-gray-400 capitalize">
                    {theme}
                  </span>
                </div>
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`mt-10 w-full flex items-center gap-3 p-3 rounded text-red-500 ${
                theme === "dark"
                  ? "hover:bg-[#202c33]"
                  : "hover:bg-gray-100"
              }`}
            >
              <FaSignOutAlt className="h-5 w-5" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setting;

