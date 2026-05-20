import { useState, useEffect, useCallback } from "react";
import PaperCard from "../components/PaperCard";
import Pagination from "../components/Pagination";
import SuccessModal from "../components/SuccessModal";
import { Trash2, Clock, Loader2 } from "lucide-react";
import {
  getHistory,
  removeHistory,
  clearHistory,
} from "../services/API";
import { useFavorites } from "../contexts/FavoritesContext";

const ITEMS_PER_PAGE = 5;

function parsePaginatedPapers(response) {
  const result = response.data ?? {};
  const list = result.data?.data || result.data || [];
  const pagination = result.data?.pagination || result.pagination || {};
  const total =
    pagination.total ??
    result.data?.total ??
    result.total ??
    (Array.isArray(list) ? list.length : 0);
  const totalPages =
    pagination.total_pages ??
    result.data?.totalPages ??
    result.totalPages ??
    Math.ceil(total / ITEMS_PER_PAGE);

  return {
    list: Array.isArray(list) ? list : [],
    total,
    totalPages: totalPages > 0 ? totalPages : 1,
  };
}

export default function HistoryPage({ searchQuery }) {
  const [historyList, setHistoryList] = useState([]);
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistory = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params = { page, limit: ITEMS_PER_PAGE };
        if (searchQuery?.trim()) params.search = searchQuery.trim();

        const res = await getHistory(params);
        const parsed = parsePaginatedPapers(res);

        setHistoryList(parsed.list);
        setTotal(parsed.total);
        setTotalPages(parsed.totalPages);
      } catch {
        setError("Không thể tải lịch sử nghiên cứu.");
      } finally {
        setLoading(false);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage, fetchHistory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Remove local toggleFavorite - using global toggleFavorite from context
  const handleRemoveItem = async (id) => {
    try {
      await removeHistory(id);
      const newPage =
        historyList.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      if (newPage === currentPage) {
        fetchHistory(newPage);
      } else {
        setCurrentPage(newPage);
      }
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveItem(p.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all bg-white border border-gray-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <PaperCard
                  paper={p}
                  isFavorite={favoriteIds.has(p.id)}
                  onToggleFavorite={() => toggleFavorite(p.id)}
                />
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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
