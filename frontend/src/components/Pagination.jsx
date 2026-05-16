import { ChevronLeft, ChevronRight } from "lucide-react";

const variants = {
  emerald: {
    active: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100",
    hover: "hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50",
    arrowHover: "hover:bg-emerald-50 hover:text-emerald-600",
  },
  green: {
    active: "bg-green-600 text-white border-green-600 shadow-md shadow-green-100",
    hover: "hover:border-green-500 hover:text-green-600 hover:bg-green-50",
    arrowHover: "hover:bg-green-50 hover:text-green-600",
  },
  red: {
    active: "bg-red-500 text-white border-red-500 shadow-md shadow-red-100",
    hover: "hover:border-red-500 hover:text-red-500 hover:bg-red-50",
    arrowHover: "hover:bg-red-50 hover:text-red-500",
  },
};

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPaginationItems(currentPage, totalPages, siblingCount = 1) {
  const totalVisibleItems = siblingCount * 2 + 5;

  if (totalPages <= totalVisibleItems) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = siblingCount * 2 + 3;
    return [...range(1, leftItemCount), "end-dots", totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = siblingCount * 2 + 3;
    return [1, "start-dots", ...range(totalPages - rightItemCount + 1, totalPages)];
  }

  return [
    1,
    "start-dots",
    ...range(leftSibling, rightSibling),
    "end-dots",
    totalPages,
  ];
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = "emerald",
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.min(
    Math.max(1, Number(currentPage) || 1),
    safeTotalPages
  );
  const styles = variants[variant] || variants.emerald;

  if (safeTotalPages <= 1) {
    return null;
  }

  const items = getPaginationItems(safeCurrentPage, safeTotalPages);

  const goToPage = (page) => {
    if (page < 1 || page > safeTotalPages || page === safeCurrentPage) {
      return;
    }

    onPageChange(page);
  };

  return (
    <nav
      className="flex flex-wrap justify-center items-center gap-2 mt-10"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage - 1)}
        disabled={safeCurrentPage === 1}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${styles.arrowHover}`}
        aria-label="Trang trước"
      >
        <ChevronLeft size={20} />
      </button>

      {items.map((item) => {
        if (typeof item === "string") {
          return (
            <span
              key={item}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold text-gray-400"
            >
              ...
            </span>
          );
        }

        const isActive = item === safeCurrentPage;

        return (
          <button
            key={item}
            type="button"
            onClick={() => goToPage(item)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
              isActive
                ? styles.active
                : `bg-white border-gray-100 text-gray-400 ${styles.hover}`
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => goToPage(safeCurrentPage + 1)}
        disabled={safeCurrentPage === safeTotalPages}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${styles.arrowHover}`}
        aria-label="Trang sau"
      >
        <ChevronRight size={20} />
      </button>
    </nav>
  );
}
