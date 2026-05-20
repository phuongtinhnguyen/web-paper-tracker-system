import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, ChevronDown, ListFilter } from "lucide-react";
import PaperCard from "../components/PaperCard";
import Pagination from "../components/Pagination";
import { getPapers, searchPapers } from "../services/API";
import { useFavorites } from "../contexts/FavoritesContext";

export default function DashboardPage({ searchQuery }) {
  const [filter, setFilter] = useState("all");
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const filterRef = useRef(null);
  const [papers, setPapers] = useState([]);
  const [searchParams] = useSearchParams();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const postsPerPage = 5;

  const topicId = searchParams.get("topic");
  const prevTopicIdRef = useRef(topicId);
  const prevSearchQueryRef = useRef(searchQuery);

  useEffect(() => {
    // Kiểm tra nếu topic hoặc từ khóa tìm kiếm thay đổi thì reset về trang 1
    const isTopicChanged = prevTopicIdRef.current !== topicId;
    const isSearchChanged = prevSearchQueryRef.current !== searchQuery;
    
    let activePage = currentPage;
    if (isTopicChanged || isSearchChanged) {
      activePage = 1;
      setCurrentPage(1);
    }
    
    prevTopicIdRef.current = topicId;
    prevSearchQueryRef.current = searchQuery;

    const fetchPapers = async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (searchQuery && searchQuery.trim()) {
          res = await searchPapers(searchQuery, { page: activePage, limit: postsPerPage });
        } else {
          const params = { page: activePage, limit: postsPerPage, filter: filter };
          if (topicId) params.topic_id = topicId;
          res = await getPapers(params);
        }

        const result = res.data ?? {};
        // Logic lấy data linh hoạt: Ưu tiên result.data.data, sau đó result.data, cuối cùng là result
        const actualData = result.data?.data || result.data || result;
        const pagination = result.data?.pagination || result.pagination || {};
        const totalItems =
          pagination.total ??
          result.data?.total ??
          result.total ??
          (Array.isArray(actualData) ? actualData.length : 0);
        
        setPapers(Array.isArray(actualData) ? actualData : []);
        setTotal(totalItems);
        
        // Tính toán tổng số trang
        const pages = pagination.total_pages ?? Math.ceil(totalItems / postsPerPage);
        setTotalPages(pages > 0 ? pages : 1);

      } catch (err) {
        console.error("Chi tiết lỗi:", err.response);
        if (err.response?.status === 404) {
          setError("Đường dẫn dữ liệu không tồn tại (404). Vui lòng liên hệ Admin.");
        } else {
          setError("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối máy chủ.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [currentPage, topicId, filter, searchQuery]);

  // Xử lý đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsOpenFilter(false);
      }
    };
    if (isOpenFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpenFilter]);

  const filterOptions = {
    all: "Tất cả bài báo",
    recent: "Bài báo gần đây",
    "2days": "2 ngày qua"
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <header className="mb-8 px-4 flex items-center justify-between gap-4">
        {/* Bộ lọc Filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsOpenFilter(!isOpenFilter)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
          >
            <ListFilter size={20} />
            <span className="font-bold">{filterOptions[filter]}</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isOpenFilter ? 'rotate-180' : ''}`} />
          </button>

          {isOpenFilter && (
            <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[1100] py-2 animate-in fade-in zoom-in duration-200">
              {Object.entries(filterOptions).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    setFilter(id);
                    setIsOpenFilter(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${
                    filter === id 
                      ? "text-emerald-600 bg-emerald-50 font-bold" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block text-right">
          <p className="text-xl font-black text-gray-800">{total} bài báo</p>
        </div>
      </header>

      {/* Hiển thị lỗi nếu có */}
      {error ? (
        <div className="text-center py-20">
           <p className="text-red-500 bg-red-50 inline-block px-6 py-3 rounded-2xl font-semibold border border-red-100">
             {error}
           </p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-medium animate-pulse">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {papers.length > 0 ? (
              papers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    isFavorite={favoriteIds.has(paper.id)}
                    onToggleFavorite={() => toggleFavorite(paper.id)}
                  />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                <p className="text-lg">Không tìm thấy bài báo nào phù hợp.</p>
              </div>
            )}
          </div>

          {/* Phân trang */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
