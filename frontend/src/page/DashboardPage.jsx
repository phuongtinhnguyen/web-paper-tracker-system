import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, ChevronDown } from "lucide-react";
import PaperCard from "../components/PaperCard";
import { getPapers, searchPapers, addFavorite, removeFavorite } from "../services/API";
import SearchBar from "../components/SearchBar";
import { ListFilter } from "lucide-react";

export default function DashboardPage({ searchQuery }) {
  const [filter, setFilter] = useState("all");
  const [isOpenFilter, setIsOpenFilter] = useState(false); 
  const filterRef = useRef(null);
  const [papers, setPapers] = useState([]);
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState(new Set());
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
    const isTopicChanged = prevTopicIdRef.current !== topicId;
    const isSearchChanged = prevSearchQueryRef.current !== searchQuery;
    const page = (isTopicChanged || isSearchChanged) ? 1 : currentPage;
    prevTopicIdRef.current = topicId;
    prevSearchQueryRef.current = searchQuery;

    if (isTopicChanged || isSearchChanged) {
        setCurrentPage(1);
    }

    const fetchPapers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Nếu có search query thì dùng API search, ngược lại dùng API thường
            let res;
            if (searchQuery && searchQuery.trim()) {
                res = await searchPapers(searchQuery, { page, limit: postsPerPage });
            } else {
                const params = { page, limit: postsPerPage, filter: filter };
                if (topicId) params.topic_id = topicId;
                res = await getPapers(params);
            }
            
            const result = res.data;
            const list = result.data ?? result;

            setPapers(list);
            setTotal(result.total ?? list.length);
            setTotalPages(
                result.totalPages ??
                Math.ceil((result.total ?? list.length) / postsPerPage)
            );
        } catch {
            setError("Không thể tải dữ liệu bài báo. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    fetchPapers();
}, [currentPage, topicId, filter, searchQuery]);

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

    const handleToggleFavorite = async (paper) => {
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

    return (
    <div className="max-w-7xl mx-auto pb-10">
      <header className="mb-8 px-4 flex items-center justify-between gap-4">
  
          {/* BÊN TRÁI: Nút Dropdown Filter - Thêm ref vào đây */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsOpenFilter(!isOpenFilter)}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
            >
              <ListFilter size={20} />
              <span className="font-bold">{filterOptions[filter]}</span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isOpenFilter ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu thả xuống */}
            {isOpenFilter && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[1100] py-2 animate-in fade-in zoom-in duration-200">
                {[
                  { id: "all", label: "Tất cả bài báo" },
                  { id: "recent", label: "Bài báo gần đây" },
                  { id: "2days", label: "2 ngày qua" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setFilter(item.id);
                      setIsOpenFilter(false); 
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${
                      filter === item.id 
                        ? "text-emerald-600 bg-emerald-50 font-bold" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ở GIỮA: SearchBar */}
          <div className="flex-1 max-w-2xl">
            <SearchBar onSearch={(q) => console.log(q)} onClear={() => {}} />
          </div>

          {/* BÊN PHẢI: Số lượng (Giữ nguyên hoặc ẩn bớt) */}
          <div className="hidden md:block text-right">
            <p className="text-xl font-black text-gray-800">{total} bài báo</p>
          </div>
        </header>

      {loading ? (
        <div className="flex justify-center py-20 text-green-600">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400 font-medium">{error}</div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {papers.length > 0 ? (
            papers.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                isFavorite={favorites.has(paper.id)}
                onToggleFavorite={() => handleToggleFavorite(paper)}
              />
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-400">
              Không có dữ liệu bài báo.
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-gray-200 hover:bg-green-50 disabled:opacity-20"
          >
            <ChevronLeft size={20} />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                currentPage === i + 1
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-100 text-gray-400 hover:border-green-500"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-gray-200 hover:bg-green-50 disabled:opacity-20"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
