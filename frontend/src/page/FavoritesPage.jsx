import { useState, useEffect } from "react";
import { Trash2, Heart, Loader2 } from "lucide-react";
import PaperCard from "../components/PaperCard";
import Pagination from "../components/Pagination";
import { getFavorites } from "../services/API";
import { useFavorites } from "../contexts/FavoritesContext";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { favoriteIds, toggleFavorite } = useFavorites();

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getFavorites({ page: currentPage, limit: itemsPerPage });
        if (cancelled) return;

        const result = res.data ?? {};
        const list = result.data?.data || result.data || [];
        const pagination = result.data?.pagination || result.pagination || {};
        const totalItems =
          pagination.total ??
          result.data?.total ??
          result.total ??
          (Array.isArray(list) ? list.length : 0);

        setFavorites(Array.isArray(list) ? list : []);
        setTotal(totalItems);
        setTotalPages(
          pagination.total_pages ??
            result.data?.totalPages ??
            result.totalPages ??
            Math.ceil(totalItems / itemsPerPage)
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
    // Optimistic: remove from local list immediately so the paper disappears
    setFavorites((prev) => prev.filter((p) => p.id !== paperId));
    setTotal((prev) => Math.max(0, prev - 1));
    
    // Also update global context
    await toggleFavorite(paperId);
    
    // Nếu xóa hết bài trên trang hiện tại, quay về trang trước
    if (favorites.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
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
                  isFavorite={favoriteIds.has(p.id)}
                  onToggleFavorite={() => handleRemoveFavorite(p.id)}
                />
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            variant="red"
          />
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