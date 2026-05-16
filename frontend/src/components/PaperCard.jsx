import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Calendar, Users, FileText } from "lucide-react";
import PaperModal from "./PaperModal";

export default function PaperCard({ paper, onToggleFavorite, isFavorite }) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Xử lý logic parse danh sách tác giả
  const getAuthors = () => {
    const rawAuthors = paper.authors ?? paper.author;

    try {
      return typeof rawAuthors === "string" ? JSON.parse(rawAuthors) : rawAuthors;
    } catch {
      return rawAuthors ? [rawAuthors] : [];
    }
  };

  const authors = getAuthors();

  const handleTitleClick = (e) => {
    e.preventDefault();
    navigate(`/paper/${paper.id}`);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-green-200 transition-all duration-300 group flex flex-col h-full">
        {/* Hàng Header: Tiêu đề bên trái, Cụm nút bên phải */}
        <div className="flex justify-between items-start gap-3 mb-auto">
          {/* Nhấn vào tiêu đề để xem chi tiết bài báo */}
          <button
            onClick={handleTitleClick}
            className="text-gray-800 font-bold text-[13px] sm:text-sm leading-snug line-clamp-2 group-hover:text-green-700 transition-colors flex-1 text-left cursor-pointer hover:underline"
            title="Nhấn để xem chi tiết bài báo"
          >
            {paper.title}
          </button>
          
          {/* Cụm nút Summary và Heart nằm kế nhau */}
          <div className="flex items-center gap-0.5 flex-shrink-0 -mt-1">
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Xem tóm tắt nhanh"
            >
              <FileText size={17} />
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite();
              }}
              className="p-1.5 rounded-full transition-colors hover:bg-red-50 group/heart"
              title={isFavorite ? "Bỏ lưu" : "Lưu vào yêu thích"}
            >
              <Heart 
                size={17} 
                fill={isFavorite ? "#ef4444" : "none"} 
                className={isFavorite ? "text-red-500" : "text-gray-400 group-hover/heart:text-red-400"}
              />
            </button>
          </div>
        </div>

        {/* Hàng Meta: Hiển thị tác giả và ngày (nhỏ và gọn) */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-tight">
            <Users size={12} className="text-green-600 flex-shrink-0" />
            <span className="truncate font-semibold">
              {Array.isArray(authors) ? authors.join(", ") : authors}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Calendar size={12} className="flex-shrink-0" />
            <span>{paper.published_at || paper.published_date || "N/A"}</span>
          </div>
        </div>

        {/* Hiển thị summary nếu có */}
        {paper.summary && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
              {paper.summary}
            </p>
          </div>
        )}
      </div>

      {/* Gọi Modal chi tiết */}
      <PaperModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        paper={paper}
        authors={authors}
      />
    </>
  );
}
