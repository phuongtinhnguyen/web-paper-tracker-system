import { Settings, Heart, Tag, Plus, LayoutDashboard, CheckCircle2, LogOut, Trash2, Edit2, Check, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Sidebar({ userEmail }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 1. Quản lý danh sách chủ đề
  const [topics, setTopics] = useState(["AI Research", "Machine Learning"]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const storedUsername = localStorage.getItem("username");

  const handleLogout = () => navigate("/");
  const isActive = (path) => location.pathname === path;

  // --- Logic xử lý Topic ---
  const addTopic = () => {
    if (newTopicName.trim()) {
      setTopics([...topics, newTopicName.trim()]);
      setNewTopicName("");
      setIsAdding(false);
    }
  };

  const deleteTopic = (index) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(topics[index]);
  };

  const saveEdit = () => {
    if (editValue.trim()) {
      const updated = [...topics];
      updated[editingIndex] = editValue.trim();
      setTopics(updated);
      setEditingIndex(null);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-emerald-100 flex flex-col h-screen">
      {/* 1. User Section */}
      <div className="p-6 relative">
        <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 text-emerald-700 font-bold text-xl hover:opacity-80 transition-all">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex-shrink-0"></div>
          <span className="truncate">{storedUsername}</span>
        </button>
        {showUserMenu && (
          <div className="absolute top-16 left-6 w-48 bg-white border border-emerald-50 shadow-xl rounded-2xl py-2 z-50">
            <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive('/dashboard') ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-700 hover:bg-emerald-50'}`}>
          <LayoutDashboard size={20} />
          <span className="font-semibold">Dashboard</span>
        </Link>
        <Link to="/topics" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive('/topics') ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-700 hover:bg-emerald-50'}`}>
          <Tag size={20} />
          <span className="font-semibold">Quản lý Topic</span>
        </Link>
        <Link to="/favorites" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive('/favorites') ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-700 hover:bg-emerald-50'}`}>
          <Heart size={20} />
          <span className="font-semibold">Mục yêu thích</span>
        </Link>
        <Link to="/history" className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive('/history') ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-700 hover:bg-emerald-50'}`}>
          <CheckCircle2 size={20} />
          <span className="font-semibold">Lịch sử đọc</span>
        </Link>

        {/* 3. Danh sách Chủ đề theo dõi */}
        <div className="pt-6 pb-2">
          <div className="flex items-center justify-between px-4 mb-2">
            <span className="text-xs font-bold text-emerald-600/50 uppercase tracking-widest">Chủ đề theo dõi</span>
            <button onClick={() => setIsAdding(true)} className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors">
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-1">
            {/* Ô nhập chủ đề mới */}
            {isAdding && (
              <div className="flex items-center gap-2 px-2 py-1">
                <input 
                  autoFocus
                  className="w-full text-sm border-b border-emerald-300 outline-none px-2 py-1"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                />
                <button onClick={addTopic} className="text-emerald-600"><Check size={14}/></button>
                <button onClick={() => setIsAdding(false)} className="text-red-400"><X size={14}/></button>
              </div>
            )}

            {/* List danh sách topic */}
            {topics.map((topic, index) => (
              <div key={index} className="group flex items-center justify-between px-4 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-all">
                {editingIndex === index ? (
                  <input 
                    autoFocus
                    className="w-full text-sm bg-transparent border-b border-emerald-400 outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-sm truncate">
                      <Tag size={14} className="flex-shrink-0" /> {topic}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(index)} className="p-1 hover:text-emerald-500"><Edit2 size={12}/></button>
                      <button onClick={() => deleteTopic(index)} className="p-1 hover:text-red-500"><Trash2 size={12}/></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* 4. Setting Footer */}
      <div className="p-4 border-t border-emerald-100">
        <button onClick={() => navigate("/change-password")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive('/change-password') ? 'bg-gray-100 text-emerald-700' : 'text-emerald-700 hover:bg-emerald-50'}`}>
          <Settings size={20} />
          <span className="font-medium">Setting</span>
        </button>
      </div>
    </aside>
  );
}