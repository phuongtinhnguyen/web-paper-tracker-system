import { useState, useEffect } from "react";
import PaperCard from "../components/PaperCard";
import { Loader2, LayoutGrid, Hash, RefreshCw } from "lucide-react";
import Pagination from "../components/Pagination";
import { getTopics, getPapersByTopic } from "../services/API";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCrawler } from "../contexts/CrawlerContext";
import {
  getPaperUpdateTopicId,
  subscribePaperDataUpdated,
} from "../utils/paperRefreshEvent";

function extractTopics(response) {
  return response.data?.data?.topics ?? response.data?.topics ?? response.data ?? [];
}

export default function TopicPage() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [error, setError] = useState(null);
  const [refreshMessage, setRefreshMessage] = useState(null);

  const { favoriteIds, toggleFavorite } = useFavorites();
  const { crawlerCooldownSeconds, isCrawlerRunning, startCrawler } = useCrawler();

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const postsPerPage = 5;

  // Lấy danh sách Topics khi vào trang
  useEffect(() => {
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const res = await getTopics();
        setTopics(extractTopics(res));
      } catch {
        setError("Không thể tải danh sách chủ đề.");
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    return subscribePaperDataUpdated((event) => {
      const updatedTopicId = getPaperUpdateTopicId(event.detail);

      if (
        selectedTopic?.id &&
        updatedTopicId &&
        String(updatedTopicId) !== String(selectedTopic.id)
      ) {
        return;
      }

      setRefreshTick((value) => value + 1);
    });
  }, [selectedTopic?.id]);

  
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

        const nextTotal = pagination.total ?? result.total ?? list.length;

        setPapers(Array.isArray(list) ? list : []);
        setTotal(nextTotal);
        setTotalPages(
          pagination.total_pages ??
            result.totalPages ??
            Math.ceil(nextTotal / postsPerPage)
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
    setRefreshMessage(null);
  };

  const handleRefreshSelectedTopic = async () => {
    if (!selectedTopic) return;

    setError(null);
    setRefreshMessage(null);

    if (crawlerCooldownSeconds > 0) {
      setRefreshMessage(`Vui lòng chờ ${crawlerCooldownSeconds}s trước khi tải lại tiếp.`);
      return;
    }

    try {
      await startCrawler({
        topic_id: selectedTopic.id,
        max_results: 5,
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setError("Đang tải lại dữ liệu, vui lòng chờ hoàn tất.");
      } else if (err.response?.status === 429) {
        setRefreshMessage("Vui lòng chờ khoảng 20 giây trước khi tải lại tiếp.");
      } else {
        setError("Không thể tải lại dữ liệu mới cho chủ đề này.");
      }
    }
  };

  if (loadingTopics) return (
    <div className="flex justify-center py-20 text-green-600">
      <Loader2 className="animate-spin" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      {error && (
        <div className="text-center py-4 text-red-400 font-medium">{error}</div>
      )}

      {/* SECTION 1: DANH SÁCH CHỦ ĐỀ */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <LayoutGrid size={20} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Quản lý chủ đề</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all border-2 ${
                selectedTopic?.id === topic.id
                  ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100 scale-105"
                  : "bg-white border-gray-100 text-gray-600 hover:border-green-400 hover:text-green-600"
              }`}
            >
              <Hash size={16} />
              {topic.name}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 2: DANH SÁCH BÀI BÁO THEO TOPIC */}
      <section className="min-h-[400px]">
        {!selectedTopic ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
            <Hash size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">Vui lòng chọn một chủ đề để xem bài báo</p>
          </div>
        ) : loadingPapers ? (
          <div className="flex justify-center py-20 text-green-600">
            <Loader2 className="animate-spin" size={30} />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-gray-700">
                  Bài báo về: <span className="text-green-600">#{selectedTopic.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleRefreshSelectedTopic}
                  disabled={isCrawlerRunning || crawlerCooldownSeconds > 0}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-green-100 text-green-700 rounded-xl text-xs font-bold shadow-sm hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  title={`Tải lại 5 paper mới cho ${selectedTopic.name}`}
                >
                  <RefreshCw
                    size={15}
                    className={isCrawlerRunning ? "animate-spin" : ""}
                  />
                  <span>
                    {isCrawlerRunning
                      ? "Đang tải lại"
                      : crawlerCooldownSeconds > 0
                        ? `Chờ ${crawlerCooldownSeconds}s`
                        : "Tải lại"}
                  </span>
                </button>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {total} kết quả
              </span>
            </div>

            {(refreshMessage || crawlerCooldownSeconds > 0) && !isCrawlerRunning && (
              <div className="rounded-2xl border border-green-100 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
                {refreshMessage || `Vui lòng chờ ${crawlerCooldownSeconds}s trước khi tải lại tiếp.`}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </section>
    </div>
  );
}
