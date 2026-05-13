import { X, ExternalLink, Users, Calendar } from "lucide-react";

export default function PaperModal({ isOpen, onClose, paper, authors }) {
  if (!isOpen || !paper) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Lớp nền mờ */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      {/* Khung nội dung */}
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div className="pr-8">
            <h2 className="text-xl font-black text-gray-800 leading-tight mb-2">
              {paper.title}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
               <div className="flex items-center gap-1.5 text-green-700">
                  <Users size={16} /> {Array.isArray(authors) ? authors.join(", ") : authors}
               </div>
               <div className="flex items-center gap-1.5">
                  <Calendar size={16} /> {paper.published_at || "N/A"}
               </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nội dung tóm tắt */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <h4 className="text-xs font-bold text-green-600 uppercase tracking-[0.2em] mb-4">Tóm tắt nội dung</h4>
          <p className="text-gray-600 leading-relaxed text-base text-justify whitespace-pre-line">
            {paper.summary || paper.abstract || "Bài báo này hiện chưa có nội dung tóm tắt chi tiết."}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/30">
          <a 
            href={paper.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
          >
            <ExternalLink size={18} />
            Đọc toàn văn bài báo
          </a>
          <button 
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}