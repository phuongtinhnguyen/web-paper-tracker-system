import { useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({ onSearch, onClear }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  function handleClear() {
    setValue(""); 
    onClear?.();
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        // Cập nhật placeholder rõ ràng hơn
        placeholder="Tìm tiêu đề, tác giả hoặc chủ đề..." 
        className="w-full border border-emerald-100 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
      />
      {value && (
        <button type="button" onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
          <X size={16} />
        </button>
      )}
    </form>
  );
}