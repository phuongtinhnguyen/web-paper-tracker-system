import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import SearchBar from "./SearchBar";

// Lấy username từ localStorage
const getUsername = () => {
  return localStorage.getItem("username") || "User";
};

export default function MainLayout({ onSearch, onClearSearch }) {
  const location = useLocation();
  const [username, setUsername] = useState(getUsername);
  const shouldShowSearchBar = location.pathname !== "/settings";

  useEffect(() => {
    const syncUsername = () => {
      setUsername(getUsername());
    };

    window.addEventListener("username-updated", syncUsername);
    window.addEventListener("storage", syncUsername);

    return () => {
      window.removeEventListener("username-updated", syncUsername);
      window.removeEventListener("storage", syncUsername);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar username={username} /> 

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER CỐ ĐỊNH */}
        <header className="p-6 bg-white border-b border-emerald-100 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            
            <div className="flex items-center justify-between w-full gap-4">
              <div className="w-1/4">
                <h1 className="text-2xl font-black text-green-800">Chào mừng trở lại! 🌿</h1>
                <p className="text-emerald-600 font-semibold text-xs mt-1 uppercase tracking-wide">
                  {username}
                </p>
              </div>
              {shouldShowSearchBar && (
                <div className="flex-1 max-w-2xl">
                  <SearchBar onSearch={onSearch} onClear={onClearSearch} />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
