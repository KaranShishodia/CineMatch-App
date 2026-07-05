import React, { useState } from 'react'

export default function StarRating({ value, onChange, size = 'md', readOnly = false }) {
  const [hover, setHover] = useState(0)

  const sizeClass = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }[size]
  const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

  return (
    <div className={`flex items-center gap-0.5 ${readOnly ? '' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = (hover || value) >= star
        const halfFilled = !filled && (hover || value) >= star - 0.5

        return (
          <span
            key={star}
            className={`${sizeClass} transition-transform duration-100 ${!readOnly && 'hover:scale-110'}`}
            style={{ color: filled || halfFilled ? '#f5c518' : '#3a3a4a' }}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange?.(hover || star)}
          >
            {filled ? '★' : halfFilled ? '½' : '☆'}
          </span>
        )
      })}
      {value > 0 && (
        <span className="ml-2 text-cinema-muted text-sm">{value}/5</span>
      )}
    </div>
  )
}
