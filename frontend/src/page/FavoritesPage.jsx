import { useState, useEffect } from "react";
import { Trash2, ChevronLeft, ChevronRight, Heart, Loader2 } from "lucide-react";
import PaperCard from "../components/PaperCard";
import { getFavorites, removeFavorite } from "../services/Api";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);S
  const itemsPerPage = 5;

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getFavorites({ page: currentPage, limit: itemsPerPage });
        if (cancelled) return;

        const result = res.data;
        const list = result.data ?? result;

        setFavorites(list);
        setTotal(result.total ?? list.length);
        setTotalPages(
          result.totalPages ??
            Math.ceil((result.total ?? list.length) / itemsPerPage)
        );
      } catch {
        if (!cancelled) setError("Không thể tải danh sách yêu thích.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFavorites();
    return () => { cancelled = true; };
  }, [currentPage]);

  const handleRemoveFavorite = async (paperId) => {
    try {
      await removeFavorite(paperId);
      
      setCurrentPage((prev) =>
        favorites.length === 1 && prev > 1 ? prev - 1 : prev
      );
    } catch {
      setError("Không thể xóa bài viết khỏi yêu thích.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in duration-500 font-sans">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-red-100 text-red-500 rounded-xl">
            <Heart size={24} fill="currentColor" />
          </div>
          Mục yêu thích
        </h1>
        <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-sm font-bold border border-red-100">
          {total} bài viết
        </span>
      </div>

      {error && (
        <div className="text-center py-4 text-red-400 font-medium mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-red-400">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : favorites.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((p) => (
              <div key={p.id} className="relative group">
                <div className="absolute top-[16px] right-[82px] z-20">
                  <button
                    onClick={() => handleRemoveFavorite(p.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all bg-white border border-gray-50 shadow-sm"
                    title="Xóa khỏi mục yêu thích"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <PaperCard
                  paper={p}
                  isFavorite={true}
                  onToggleFavorite={() => handleRemoveFavorite(p.id)}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    currentPage === i + 1
                      ? "bg-red-500 text-white shadow-lg shadow-red-100"
                      : "bg-white border border-gray-100 text-gray-400 hover:border-red-500"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-red-50 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <Heart size={48} className="text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">Bạn chưa lưu bài viết nào.</p>
        </div>
      )}
    </div>
  );
}
