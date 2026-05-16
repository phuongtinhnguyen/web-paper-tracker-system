import { useState, useEffect } from "react"; 
import { Search, X } from "lucide-react";

export default function SearchBar({ onSearch, onClear }) {
  const [value, setValue] = useState("");

  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch?.(value.trim());
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [value, onSearch]);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch?.(value.trim());
  }

  function handleClear() {
    setValue("");
    onClear?.();
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      {/* Icon Search */}
      <Search 
        size={18} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" 
      />
      
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tìm tiêu đề, tác giả hoặc chủ đề..."
        className="w-full border border-emerald-100 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm transition-all"
      />

      {/* Nút Xóa */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
}