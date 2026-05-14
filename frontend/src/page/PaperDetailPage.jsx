import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users, ExternalLink, Heart, Loader2 } from "lucide-react";
import { getPaperById, addFavorite, removeFavorite } from "../services/API";

export default function PaperDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchPaper = async () => {
      setLoading(true);
      try {
        const res = await getPaperById(id);
        setPaper(res.data);
        setIsFavorite(res.data.is_favorited || false);
      } catch {
        setError("Không thể tải thông tin bài báo.");
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(paper.id);
      } else {
        await addFavorite(paper.id);
      }
      setIsFavorite(!isFavorite);
    } catch {
      // Revert state if API fails
      setIsFavorite(isFavorite);
    }
  };

  // Parse authors
  let authors = [];
  if (paper) {
    try {
      authors = typeof paper.authors === 'string' 
        ? JSON.parse(paper.authors) 
        : paper.authors || [];
    } catch {
      authors = paper.authors ? [paper.authors] : [];
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-green-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 font-medium mb-4">{error || "Không tìm thấy bài báo."}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition mb-6 font-semibold"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Card chính */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-black text-gray-800 leading-tight flex-1">
              {paper.title}
            </h1>
            <button
              onClick={handleToggleFavorite}
              className={`p-3 rounded-full transition-all flex-shrink-0 ${
                isFavorite 
                  ? "bg-red-50 text-red-500" 
                  : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400"
              }`}
              title={isFavorite ? "Bỏ lưu" : "Lưu vào yêu thích"}
            >
              <Heart 
                size={22} 
                fill={isFavorite ? "#ef4444" : "none"} 
              />
            </button>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-green-600" />
              <span className="font-medium">
                {Array.isArray(authors) ? authors.join(", ") : authors}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-green-600" />
              <span>{paper.published_at || paper.published_date || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Nội dung */}
        <div className="p-8">
          {/* Summary */}
          {paper.summary && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-3">
                Tóm tắt
              </h3>
              <div className="bg-green-50/50 border border-green-100 rounded-xl p-5">
                <p className="text-gray-700 leading-relaxed text-justify">
                  {paper.summary}
                </p>
              </div>
            </div>
          )}

          {/* Abstract */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
              Tóm tắt nội dung (Abstract)
            </h3>
            <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-line">
              {paper.abstract}
            </p>
          </div>

          {/* Authors */}
          {authors.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
                Tác giả
              </h3>
              <div className="flex flex-wrap gap-2">
                {authors.map((author, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    {author}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex gap-4">
          <a
            href={paper.pdf_url || paper.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg"
          >
            <ExternalLink size={18} />
            Đọc toàn văn bài báo trên arXiv
          </a>
        </div>
      </div>
    </div>
  );
}