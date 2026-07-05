import React from 'react'

/**
 * Pagination — renders page number buttons with ellipsis for large page counts.
 * Props:
 *   currentPage  — 1-indexed current page
 *   totalPages   — total number of pages
 *   onPageChange — callback(newPage)
 *   maxVisible   — how many page buttons to show (default 5)
 */
export default function Pagination({ currentPage, totalPages, onPageChange, maxVisible = 5 }) {
  if (totalPages <= 1) return null

  // Build the array of page numbers to display (with null = ellipsis)
  const buildPages = () => {
    const pages = []
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end   = Math.min(totalPages, start + maxVisible - 1)

    // Adjust start if we're near the end
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)

    if (start > 1) { pages.push(1); if (start > 2) pages.push(null) }
    for (let p = start; p <= end; p++) pages.push(p)
    if (end < totalPages) { if (end < totalPages - 1) pages.push(null); pages.push(totalPages) }

    return pages
  }

  const btnClass = (active) =>
    `w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center
    ${active
      ? 'bg-cinema-gold text-black font-bold'
      : 'border border-cinema-border text-cinema-muted hover:border-cinema-gold hover:text-cinema-gold'
    }`

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      {/* Previous */}
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`${btnClass(false)} disabled:opacity-30 disabled:cursor-not-allowed px-3`}
      >
        ‹
      </button>

      {buildPages().map((page, i) =>
        page === null ? (
          <span key={`dots-${i}`} className="w-9 text-center text-cinema-muted">…</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={btnClass(page === currentPage)}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`${btnClass(false)} disabled:opacity-30 disabled:cursor-not-allowed px-3`}
      >
        ›
      </button>
    </div>
  )
}
