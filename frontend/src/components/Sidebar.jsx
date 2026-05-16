import { 
  Settings, Heart, LayoutDashboard, 
  CheckCircle2, LogOut, BellDot, 
  Bookmark
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Sidebar({ username = "User" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Lấy ký tự đầu của username để hiển thị avatar
  const getInitial = (name) => {
    return name.charAt(0).toUpperCase();
  };

  // Danh sách các mục menu chính
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/topics', icon: Bookmark, label: 'Quản lý chủ đề' },
    { path: '/favorites', icon: Heart, label: 'Mục yêu thích' },
    { path: '/history', icon: CheckCircle2, label: 'Lịch sử đọc' },
    { path: '/tracking-topics', icon: BellDot, label: 'Chủ đề theo dõi' }
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <aside className="w-64 bg-white border-r border-emerald-100 flex flex-col h-screen overflow-hidden font-sans">
      
      {/* 1. Profile Section */}
      <div className="p-6 relative">
        <button 
          onClick={() => setShowUserMenu(!showUserMenu)} 
          className="flex items-center gap-3 text-emerald-700 font-bold text-xl hover:opacity-80 transition-all w-full"
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex-shrink-0 shadow-md border-2 border-emerald-200 flex items-center justify-center text-white font-black">
            {getInitial(username)}
          </div>
          <span className="truncate text-lg">{username}</span>
        </button>
        
        {showUserMenu && (
          <div className="absolute top-20 left-6 w-52 bg-white border border-emerald-50 shadow-2xl rounded-2xl py-2 z-50 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={handleLogout} 
              className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors font-semibold"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </div>

      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        
        {/* Nhóm Menu Chính */}
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                isActive(item.path) 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <item.icon 
                size={20} 
                className={isActive(item.path) ? 'text-white' : 'text-emerald-500 group-hover:scale-110 transition-transform'} 
              />
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          ))}
        </div>

        
      </nav>

      
      <div className="p-4 mt-auto border-t border-emerald-50 bg-gray-50/30">
        <button 
          onClick={() => navigate("/settings")} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            isActive('/settings') 
            ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' 
            : 'text-emerald-600 hover:bg-white hover:shadow-sm'
          }`}
        >
          <Settings size={20} className={isActive('/settings') ? 'animate-spin-slow' : ''} />
          <span className="font-semibold text-sm">Cài đặt</span>
        </button>
      </div>
    </aside>
  );
}