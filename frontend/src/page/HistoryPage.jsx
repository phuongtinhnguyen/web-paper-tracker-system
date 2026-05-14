import { useState, useEffect, useCallback } from "react";
import PaperCard from "../components/PaperCard";
import SuccessModal from "../components/SuccessModal";
import { Trash2, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getHistory, removeHistory, clearHistory, addFavorite, removeFavorite } from "../services/API";

export default function HistoryPage({ searchQuery }) {
  const [historyList, setHistoryList] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 6;

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: itemsPerPage };
      if (searchQuery) params.search = searchQuery;

      const res = await getHistory(params);
      const result = res.data;
      const list = result.data ?? result;

      setHistoryList(list);
      setTotal(result.total ?? list.length);
      setTotalPages(result.totalPages ?? Math.ceil((result.total ?? list.length) / itemsPerPage));
    } catch {
      setError("Không thể tải lịch sử nghiên cứu.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;

    const fetchFavorites = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getHistory({ page: currentPage, limit: itemsPerPage });
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


  const toggleFavorite = async (paper) => {
    const paperId = paper.id;
    const isFav = favorites.has(paperId);

    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(paperId);
      else next.add(paperId);
      return next;
    });

    try {
      if (isFav) await removeFavorite(paperId);
      else await addFavorite(paperId);
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(paperId);
        else next.delete(paperId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      await removeHistory(id);
      const newPage = historyList.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      fetchHistory(newPage);
    } catch {
      setError("Không thể xóa mục khỏi lịch sử.");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearHistory();
      setHistoryList([]);
      setTotal(0);
      setTotalPages(1);
      setCurrentPage(1);
      setIsModalOpen(true);
    } catch {
      setError("Không thể xóa lịch sử.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-in fade-in duration-500 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Clock size={24} />
          </div>
          Lịch sử xem
        </h1>
        {total > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl border border-red-100 transition-colors"
          >
            Xóa tất cả lịch sử xem
          </button>
        )}
      </div>

      {error && (
        <div className="text-center py-4 text-red-400 font-medium mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      ) : historyList.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyList.map((p) => (
              <div key={p.id} className="relative group">
                <div className="absolute top-[16px] right-[82px] z-20">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveItem(p.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all bg-white border border-gray-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <PaperCard
                  paper={p}
                  isFavorite={favorites.has(p.id)}
                  onToggleFavorite={() => toggleFavorite(p)}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-emerald-50 disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    currentPage === i + 1
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-white border border-gray-100 text-gray-400 hover:border-emerald-500"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-emerald-50 disabled:opacity-20 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-400 font-medium">
          Lịch sử trống.
        </div>
      )}

      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thành công!"
        message="Toàn bộ lịch sử xem của bạn đã được xóa sạch."
      />
    </div>
  );
}
