import { Outlet, useNavigate } from "react-router-dom";
import { Settings, Tag, Heart, CheckCircle2 } from "lucide-react";
import SearchBar from "./SearchBar"; 
import Sidebar from "./Sidebar"; 

export default function MainLayout({ readCount, onSearch, onClearSearch }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar /> 

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER CỐ ĐỊNH */}
        <header className="p-6 bg-white border-b border-emerald-100 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            
            <div className="flex items-center justify-between w-full gap-4">
              <div className="w-1/4">
                <h1 className="text-2xl font-black text-green-800">Chào mừng đã trở lại! 🌿</h1>
                <p className="text-emerald-600 font-semibold text-xs mt-1 uppercase tracking-wide">
                  {readCount} bài đã xem hôm nay
                </p>
              </div>

            

              
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