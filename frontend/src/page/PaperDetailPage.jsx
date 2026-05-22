import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  ExternalLink,
  Heart,
  Loader2,
  Star,
  X,
} from "lucide-react";
import {
  getPaperById,
  summarizePaper,
  addFavorite,
  removeFavorite,
  getRelatedPapers,
  getMatchingPapers,
  submitRating,
  getMyRating,
} from "../services/API";
import PaperCard from "../components/PaperCard";

export default function PaperDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [relatedPapers, setRelatedPapers] = useState([]);
  const [matchingPapers, setMatchingPapers] = useState([]);

  // Rating state
  const [avgRating, setAvgRating] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingSubmitLoading, setRatingSubmitLoading] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  // Hover stars
  const [hoverStars, setHoverStars] = useState(0);

  useEffect(() => {
    const fetchPaper = async () => {
      setLoading(true);
      try {
        const res = await getPaperById(id);
        const paperData = res.data.data || res.data;

        setPaper(paperData);
        setIsFavorite(paperData.is_favorited || false);

        // Lấy điểm trung bình từ paper data nếu có
        if (paperData.avg_rating) {
          setAvgRating(Number(paperData.avg_rating));
        }

        if (!paperData.summary) {
          try {
            setSummaryLoading(true);
            setSummaryError(null);

            const summaryRes = await summarizePaper(id);
            const summaryData = summaryRes.data.data;

            setPaper({
              ...paperData,
              summary: summaryData.summary,
            });
          } catch {
            setSummaryError("Chưa thể tạo tóm tắt cho bài báo này.");
          } finally {
            setSummaryLoading(false);
          }
        }
      } catch {
        setError("Không thể tải thông tin bài báo.");
      } finally {
        setLoading(false);
      }
    };
    fetchPaper();
  }, [id]);

  // Lấy đánh giá của user
  useEffect(() => {
    const fetchMyRating = async () => {
      try {
        const res = await getMyRating(id);
        const data = res.data?.data || res.data;
        if (data?.rating) {
          setMyRating(Number(data.rating));
        }
      } catch {
        // Chưa đánh giá hoặc API chưa có
      }
    };
    if (id) fetchMyRating();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(paper.id);
      } else {
        await addFavorite(paper.id);
      }
      setIsFavorite(!isFavorite);
    } catch {
      setIsFavorite(isFavorite);
    }
  };

  // Lấy danh sách bài báo liên quan
  useEffect(() => {
    const fetchRelatedPapers = async () => {
      if (paper) {
        try {
          const res = await getRelatedPapers(paper.id, { limit: 5 });
          const data =
            res.data?.data?.related_papers ||
            res.data?.related_papers ||
            res.data?.data ||
            res.data ||
            [];

          setRelatedPapers(Array.isArray(data) ? data : []);
        } catch {
          // Không cần xử lý lỗi
        }
      }
    };
    fetchRelatedPapers();
  }, [paper?.id]);

  // Lấy danh sách bài báo trùng/gần giống
  useEffect(() => {
    const fetchMatchingPapers = async () => {
      if (paper) {
        try {
          const res = await getMatchingPapers(paper.id, { limit: 5 });
          const data =
            res.data?.data?.matches ||
            res.data?.matches ||
            res.data?.data ||
            res.data ||
            [];

          setMatchingPapers(Array.isArray(data) ? data : []);
        } catch {
          // Không cần xử lý lỗi
        }
      }
    };
    fetchMatchingPapers();
  }, [paper?.id]);

  // Mở modal đánh giá
  const handleOpenRating = () => {
    setSelectedStars(myRating || 0);
    setHoverStars(0);
    setRatingError(null);
    setShowRatingModal(true);
  };

  // Gửi đánh giá
  const handleSubmitRating = async () => {
    if (selectedStars === 0) return;
    setRatingSubmitLoading(true);
    setRatingError(null);
    try {
      const res = await submitRating(id, selectedStars);
      const data = res.data?.data || res.data;

      // Cập nhật điểm từ API trả về
      if (data?.avg_rating) {
        setAvgRating(Number(data.avg_rating));
      }

      setMyRating(selectedStars);
      setShowRatingModal(false);
    } catch (err) {
      console.error("Rating error:", err?.response || err);
      setRatingError("Không thể gửi đánh giá. Vui lòng thử lại sau.");
    } finally {
      setRatingSubmitLoading(false);
    }
  };

  // Parse authors
  let authors = [];
  if (paper) {
    try {
      authors =
        typeof paper.authors === "string"
          ? JSON.parse(paper.authors)
          : paper.authors || [];
    } catch {
      authors = paper.authors ? [paper.authors] : [];
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-green-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 font-medium mb-4">
          {error || "Không tìm thấy bài báo."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition mb-6 font-semibold"
      >
        <ArrowLeft size={20} />
        Quay lại
      </button>

      {/* Card chính */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-black text-gray-800 leading-tight flex-1">
              {paper.title}
            </h1>
            <button
              onClick={handleToggleFavorite}
              className={`p-3 rounded-full transition-all flex-shrink-0 ${
                isFavorite
                  ? "bg-red-50 text-red-500"
                  : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400"
              }`}
              title={isFavorite ? "Bỏ lưu" : "Lưu vào yêu thích"}
            >
              <Heart size={22} fill={isFavorite ? "#ef4444" : "none"} />
            </button>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-6 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-green-600" />
              <span className="font-medium">
                {Array.isArray(authors) ? authors.join(", ") : authors}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-green-600" />
              <span>{paper.published_at || paper.published_date || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Nội dung */}
        <div className="p-8">
          {/* Summary */}
          {paper.summary && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-3">
                Tóm tắt
              </h3>
              <div className="bg-green-50/50 border border-green-100 rounded-xl p-5">
                <p className="text-gray-700 leading-relaxed text-justify">
                  {paper.summary}
                </p>
              </div>
            </div>
          )}

          {!paper.summary && summaryLoading && (
            <div className="mb-8 bg-green-50/50 border border-green-100 rounded-xl p-5 text-green-700 font-medium">
              <Loader2 className="animate-spin inline mr-2" size={16} />
              Đang tạo tóm tắt...
            </div>
          )}

          {!paper.summary && summaryError && (
            <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-5 text-red-500 font-medium">
              {summaryError}
            </div>
          )}

          {/* Abstract */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
              Tổng quan bài báo
            </h3>
            <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-line">
              {paper.abstract}
            </p>
          </div>

          {/* Authors */}
          {authors.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
                Tác giả
              </h3>
              <div className="flex flex-wrap gap-2">
                {authors.map((author, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                  >
                    {author}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bài báo liên quan */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/30">
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">
            Bài báo liên quan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedPapers.length > 0 ? (
              relatedPapers.map((related) => (
                <PaperCard
                  key={related.id}
                  paper={related}
                  showActions={false}
                  clickableCard
                />
              ))
            ) : (
              <p className="text-gray-500">Không có bài báo liên quan.</p>
            )}
          </div>
        </div>

        {/* Bài báo trùng hoặc gần giống */}
        <div className="p-8 border-t border-gray-100 bg-yellow-50/30">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-3 flex items-center gap-2">
            
            Bài báo trùng hoặc gần giống
          </h3>
          <div className="flex flex-col gap-4">
            {matchingPapers.length > 0 ? (
              matchingPapers.map((match) => {
                const paperData = match.paper || match.matching_paper || match;
                const matchAuthors = (() => {
                  try {
                    return typeof paperData.authors === "string"
                      ? JSON.parse(paperData.authors)
                      : paperData.authors || [];
                  } catch {
                    return paperData.authors ? [paperData.authors] : [];
                  }
                })();

                return (
                  <div
                    key={paperData.id || match.id}
                    className="border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-yellow-600 font-bold text-xs bg-yellow-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        {match.similarity_score
                          ? `${Math.round(match.similarity_score * 100)}%`
                          : "Trùng"}
                      </span>
                      <h4 className="font-bold text-gray-700">
                        {paperData.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {Array.isArray(matchAuthors)
                        ? matchAuthors.join(", ")
                        : matchAuthors}
                    </p>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {paperData.abstract?.substring(0, 200)}...
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">Không có bài báo trùng hoặc gần giống.</p>
            )}
          </div>
        </div>

        {/* Đánh giá bài báo */}
        <div className="p-8 border-t border-gray-100 bg-white">
          <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-4">
            Đánh giá bài báo
          </h3>
          <div className="flex items-center gap-6">
            {/* Hiển thị sao trung bình */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= Math.round(avgRating)
                        ? "text-red-500 fill-red-500"
                        : "text-gray-200 fill-gray-200"
                    }
                  />
                ))}
              </div>
              <span className="text-xl font-black text-gray-700">
                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                <span className="text-sm font-normal text-gray-400"> /10</span>
              </span>
            </div>

            {/* Button đánh giá */}
            <div className="flex flex-col items-center gap-2">
              {myRating > 0 && (
                <p className="text-xs text-gray-500">
                  Bạn đã đánh giá: <span className="font-bold text-red-500">{myRating}</span>/10
                </p>
              )}
              <button
                onClick={handleOpenRating}
                className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Star size={16} fill="white" />
                {myRating > 0 ? "Đánh giá lại" : "Đánh giá"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex gap-4">
          <a
            href={paper.pdf_url || paper.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg"
          >
            <ExternalLink size={18} />
            Đọc toàn văn bài báo trên arXiv
          </a>
        </div>
      </div>

      {/* Modal đánh giá */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-gray-100 animate-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">Đánh giá bài báo</h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stars selection */}
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedStars(star)}
                  onMouseEnter={() => setHoverStars(star)}
                  onMouseLeave={() => setHoverStars(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={
                      star <= (hoverStars || selectedStars)
                        ? "text-red-500 fill-red-500"
                        : "text-gray-200 fill-gray-200"
                    }
                  />
                </button>
              ))}
            </div>

            {/* Hiển thị số sao đã chọn */}
            <p className="text-center text-lg font-bold text-gray-700 mb-4">
              {selectedStars > 0 ? `${selectedStars} / 10 sao` : "Chọn số sao"}
            </p>

            {/* Error message */}
            {ratingError && (
              <p className="text-center text-xs text-red-500 font-medium mb-4">
                {ratingError}
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={selectedStars === 0 || ratingSubmitLoading}
                className={`flex-1 py-2.5 rounded-xl font-bold text-white transition-all ${
                  selectedStars === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 shadow-md"
                }`}
              >
                {ratingSubmitLoading ? (
                  <Loader2 className="animate-spin mx-auto" size={18} />
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
