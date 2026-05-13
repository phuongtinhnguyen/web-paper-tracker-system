import { useState, useEffect } from "react";
import PaperCard from "../components/PaperCard";
import { Loader2, LayoutGrid, ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { getTopics, getPapersByTopic, addFavorite, removeFavorite } from "../services/api";

export default function TopicPage() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [error, setError] = useState(null);

  const [favorites, setFavorites] = useState(new Set());

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const postsPerPage = 5;

  // Lấy danh sách Topics khi vào trang
  useEffect(() => {
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const res = await getTopics();
        setTopics(res.data);
      } catch {
        setError("Không thể tải danh sách chủ đề.");
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, []);

  
  useEffect(() => {
    if (!selectedTopic) return;

    const fetchPapers = async () => {
      setLoadingPapers(true);
      try {
        const res = await getPapersByTopic(selectedTopic.id, {
          page: currentPage,
          limit: postsPerPage,
        });
        const result = res.data;
        const list = result.data ?? result;

        setPapers(list);
        setTotal(result.total ?? list.length);
        setTotalPages(result.totalPages ?? Math.ceil((result.total ?? list.length) / postsPerPage));
      } catch {
        setError("Không thể tải bài báo.");
      } finally {
        setLoadingPapers(false);
      }
    };

    fetchPapers();
  }, [selectedTopic, currentPage]);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
    setCurrentPage(1);
    setPapers([]);
  };

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
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Quản lý Topic</h2>
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
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-gray-700">
                Bài báo về: <span className="text-green-600">#{selectedTopic.name}</span>
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {total} kết quả
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.length > 0 ? (
                papers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    isFavorite={favorites.has(paper.id)}
                    onToggleFavorite={() => toggleFavorite(paper)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-gray-400">
                  Chủ đề này hiện chưa có bài báo nào.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-green-50 disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-1.5">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-green-600 text-white shadow-lg"
                          : "bg-white border border-gray-100 text-gray-500 hover:border-green-500"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-green-50 disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
