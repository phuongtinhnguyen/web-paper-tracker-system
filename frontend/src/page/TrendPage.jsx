import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Hash } from "lucide-react";
import PaperCard from "../components/PaperCard";
import Pagination from "../components/Pagination";
import { getTrendingTopics, getPapersByTopic } from "../services/API";
import { useFavorites } from "../contexts/FavoritesContext";
import { subscribePaperDataUpdated } from "../utils/paperRefreshEvent";

export default function TrendPage() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [error, setError] = useState(null);
  const { favoriteIds, toggleFavorite } = useFavorites();

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const postsPerPage = 5;

  useEffect(() => {
    return subscribePaperDataUpdated(() => {
      setRefreshTick((value) => value + 1);
    });
  }, []);

  // Lấy danh sách Topics khi vào trang
  useEffect(() => {
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const res = await getTrendingTopics();
        // API trả về danh sách topic xu hướng đã sắp xếp theo thứ tự
        const topicsList = res.data?.data || res.data || [];
        setTopics(Array.isArray(topicsList) ? topicsList : []);
      } catch {
        setError("Không thể tải danh sách xu hướng.");
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, [refreshTick]);

  useEffect(() => {
    if (!selectedTopic) return;

    const fetchPapers = async () => {
      setLoadingPapers(true);
      try {
        const res = await getPapersByTopic(selectedTopic.id, {
          page: currentPage,
          limit: postsPerPage,
        });
        const result = res.data ?? {};
        const list = result.data ?? [];
        const pagination = result.pagination ?? {};

        setPapers(Array.isArray(list) ? list : []);
        setTotal(pagination.total ?? result.total ?? list.length);
        setTotalPages(
          pagination.total_pages ??
            result.totalPages ??
            Math.ceil((pagination.total ?? result.total ?? list.length) / postsPerPage)
        );
      } catch {
        setError("Không thể tải bài báo.");
      } finally {
        setLoadingPapers(false);
      }
    };

    fetchPapers();
  }, [selectedTopic, currentPage, refreshTick]);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setCurrentPage(1);
    setPapers([]);
  };

  if (loadingTopics) {
    return (
      <div className="flex justify-center py-20 text-emerald-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="pb-20 animate-in fade-in duration-500">
      {error && (
        <div className="text-center py-4 text-red-400 font-medium mb-4">{error}</div>
      )}

      {/* Tiêu đề */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
          <TrendingUp size={20} />
        </div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">
          Chủ đề xu hướng
        </h2>
      </div>

      {/* Layout 2 cột: Button bên trái - Paper bên phải */}
      <div className="flex gap-6">
        {/* Cột trái: Danh sách xu hướng */}
        <div className="w-64 flex-shrink-0">
          <div className="flex flex-col gap-2">
            {topics.map((topic, index) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border-2 text-left ${
                  selectedTopic?.id === topic.id
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105"
                    : "bg-white border-gray-100 text-gray-600 hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm">{topic.name}</span>
              </button>
            ))}
            {topics.length === 0 && (
              <div className="flex items-center justify-center py-10 text-gray-400 font-medium">
                <Hash size={20} className="mr-2" />
                Chưa có chủ đề nào
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Danh sách bài báo */}
        <div className="flex-1 min-h-[400px]">
          {!selectedTopic ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
              <TrendingUp size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">
                Vui lòng chọn một xu hướng để xem bài báo liên quan
              </p>
            </div>
          ) : loadingPapers ? (
            <div className="flex justify-center py-20 text-emerald-600">
              <Loader2 className="animate-spin" size={30} />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-700">
                  Bài báo xu hướng:{" "}
                  <span className="text-emerald-600">#{selectedTopic.name}</span>
                </h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {total} kết quả
                </span>
              </div>

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
                  <div className="col-span-full text-center py-10 text-gray-400">
                    Chủ đề này hiện chưa có bài báo nào.
                  </div>
                )}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                variant="green"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
