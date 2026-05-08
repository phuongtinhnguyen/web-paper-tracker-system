// ============================================================
// components/PaperCard.jsx — Người 4 (Diễm) phụ trách
// ============================================================
import { Link } from "react-router-dom";
import { ExternalLink, Heart, Calendar, Users } from "lucide-react";

export default function PaperCard({ paper, onToggleFavorite, isFavorite }) {
  let authors = [];
  try { authors = JSON.parse(paper.authors); } catch { authors = [paper.authors]; }

  return (
    <div className="bg-white rounded-xl border border-green-200 p-5 hover:shadow-md transition-shadow">
      {/* Title */}
      <Link to={`/paper/${paper.id}`} className="text-black font-semibold text-sm leading-snug hover:text-green-700 line-clamp-2 block mb-2">
        {paper.title}
      </Link>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1">
          <Users size={11} /> {authors.slice(0,2).join(", ")}{authors.length>2 && " +..."}
        </span>
        {paper.published_at && (
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {paper.published_at}
          </span>
        )}
      </div>

      {/* Summary */}
      {paper.summary ? (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 bg-blue-50 rounded-lg p-3 mb-3">
          ✨ {paper.summary}
        </p>
      ) : (
        <p className="text-xs text-gray-400 italic mb-3 line-clamp-2">{paper.abstract}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <a href={paper.link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-700">
          <ExternalLink size={12} /> click here to read
        </a>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài thẻ card
            onToggleFavorite();
          }}
          className="flex items-center gap-1 text-sm transition-colors"
          >
          <Heart 
            size={18} 
            // Nếu isFavorite là true thì tô màu đỏ, ngược lại để màu xám
            fill={isFavorite ? "#ef4444" : "none"} 
            className={isFavorite ? "text-red-500" : "text-gray-400"}
          />
          <span>{isFavorite ? "Đã lưu" : "Lưu"}</span>
        </button>
      </div>
    </div>
  );
}
