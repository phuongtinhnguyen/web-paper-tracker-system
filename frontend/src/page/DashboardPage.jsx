import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import PaperCard from "../components/PaperCard";
import { getPapers, addFavorite, removeFavorite } from "../services/api";

export default function DashboardPage() {
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

  useEffect(() => {
   
    const isTopicChanged = prevTopicIdRef.current !== topicId;
    const page = isTopicChanged ? 1 : currentPage;
    prevTopicIdRef.current = topicId;

    if (isTopicChanged) {
      setCurrentPage(1);
    }

    const fetchPapers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, limit: postsPerPage };
        if (topicId) params.topic_id = topicId;

        const res = await getPapers(params);
        const result = res.data;
        const list = result.data ?? result;

        setPapers(list);
        setTotal(result.total ?? list.length);
        setTotalPages(
          result.totalPages ??
            Math.ceil((result.total ?? list.length) / postsPerPage)
        );
      } catch (err) {
        setError("Không thể tải dữ liệu bài báo. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [currentPage, topicId]); 

  const handleToggleFavorite = async (paper) => {
    const paperId = paper.id;
    const isFav = favorites.has(paperId);

    // Optimistic update
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
      <header className="mb-6 px-2">
        <h2 className="text-2xl font-black text-gray-800">
          {topicId ? `Chủ đề: ${topicId}` : "Khám phá bài báo mới"}
        </h2>
        <p className="text-gray-500 text-sm font-medium">Tìm thấy {total} kết quả</p>
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
