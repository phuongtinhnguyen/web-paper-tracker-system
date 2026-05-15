import { useState, useEffect, useRef } from "react";
import {Plus, Tag, ChevronDown,Hash, Loader2, X, LayoutGrid, ChevronLeft, ChevronRight} from "lucide-react";
import PaperCard from "../components/PaperCard";
import {
  getTopics,
  getPapersByTopic,
  getTrackedTopics,
  trackTopic,
  untrackTopic,
  addFavorite,
  removeFavorite,
} from "../services/API";

function extractTopics(response) {
  return response.data?.data?.topics ?? response.data?.topics ?? response.data ?? [];
}

export default function TrackingTopics() {
  const dropdownRef = useRef(null);

  const [allTopics, setAllTopics] = useState([]);
  const [followedTopics, setFollowedTopics] = useState([]);
  const [favorites, setFavorites] = useState(new Set());

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  
  useEffect(() => {
    const fetchData = async () => {
      setLoadingTopics(true);
      try {
        const [allRes, trackedRes] = await Promise.all([
          getTopics(),
          getTrackedTopics(),
        ]);
        setAllTopics(extractTopics(allRes));
        setFollowedTopics(extractTopics(trackedRes));
      } catch {
        setError("Không thể tải dữ liệu chủ đề.");
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedTopic) return;

    const fetchPapers = async () => {
      setLoadingPapers(true);
      try {
        const res = await getPapersByTopic(selectedTopic.id, {
          page: currentPage,
          limit: itemsPerPage,
        });
        const result = res.data ?? {};
        const list = result.data ?? [];
        const pagination = result.pagination ?? {};

        setPapers(Array.isArray(list) ? list : []);
        setTotalPages(
          pagination.total_pages ??
            result.totalPages ??
            Math.ceil((pagination.total ?? result.total ?? list.length) / itemsPerPage)
        );
      } catch {
        setError("Không thể tải bài báo.");
      } finally {
        setLoadingPapers(false);
      }
    };

    fetchPapers();
  }, [selectedTopic, currentPage]);

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

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setCurrentPage(1);
    setPapers([]);
  };

  const addTopic = async (topic) => {
    if (followedTopics.find((t) => t.id === topic.id)) {
      setShowDropdown(false);
      return;
    }
    try {
      await trackTopic(topic.id);
      setFollowedTopics((prev) => [...prev, topic]);
    } catch {
      setError("Không thể thêm chủ đề.");
    }
    setShowDropdown(false);
  };

  const removeTopic = async (e, topicId) => {
    e.stopPropagation();
    try {
      await untrackTopic(topicId);
      setFollowedTopics((prev) => prev.filter((t) => t.id !== topicId));
      if (selectedTopic?.id === topicId) setSelectedTopic(null);
    } catch {
      setError("Không thể xóa chủ đề.");
    }
  };

  // Topics chưa theo dõi (hiển thị trong dropdown)
  const availableTopics = allTopics.filter(
    (t) => !followedTopics.find((f) => f.id === t.id)
  );

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 font-sans">
      {error && (
        <div className="text-center py-2 text-red-400 font-medium">{error}</div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <LayoutGrid className="text-emerald-500" /> Chủ đề theo dõi
        </h2>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} /> Thêm chủ đề <ChevronDown size={16} />
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border shadow-2xl rounded-2xl py-2 z-50">
              {loadingTopics ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-emerald-500" size={24} />
                </div>
              ) : availableTopics.length > 0 ? (
                availableTopics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => addTopic(t)}
                    className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                  >
                    <Hash size={14} className="text-emerald-400" /> {t.name}
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-gray-400">Đã theo dõi tất cả chủ đề.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {followedTopics.map((topic) => (
          <div key={topic.id} className="relative group">
            <button
              onClick={() => handleTopicSelect(topic)}
              className={`pl-5 pr-12 py-3 rounded-2xl font-bold border-2 transition-all ${
                selectedTopic?.id === topic.id
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                  : "bg-white border-slate-100 text-slate-600 hover:border-emerald-200"
              }`}
            >
              <Tag size={16} className="inline mr-2" /> {topic.name}
            </button>
            <button
              onClick={(e) => removeTopic(e, topic.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>

      <div className="min-h-[300px]">
        {loadingPapers ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
          </div>
        ) : selectedTopic ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              Kết quả: <span className="text-emerald-600">#{selectedTopic.name}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((p) => (
                <PaperCard
                  key={p.id}
                  paper={p}
                  isFavorite={favorites.has(p.id)}
                  onToggleFavorite={() => toggleFavorite(p)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-emerald-50 disabled:opacity-20"
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
                  className="p-2 rounded-xl border border-gray-200 hover:bg-emerald-50 disabled:opacity-20"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <Hash size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">
              Chọn chủ đề bên trên để xem các bài báo liên quan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
