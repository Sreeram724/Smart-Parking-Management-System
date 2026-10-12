import React from "react";

// Self-contained deterministic SVG QR code pattern generator based on string hash
export default function QRCodeView({ text, size = 160 }) {
  // Simple deterministic 21x21 matrix generation based on input text
  const matrixSize = 21;
  const matrix = Array(matrixSize)
    .fill(null)
    .map(() => Array(matrixSize).fill(false));

  // Finder patterns at corners (7x7)
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        } else {
          matrix[startY + r][startX + c] = false;
        }
      }
    }
  };

  drawFinder(0, 0); // Top-left
  drawFinder(14, 0); // Top-right
  drawFinder(0, 14); // Bottom-left

  // Fill pseudo-random deterministic payload from text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Don't overwrite corner finder patterns
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= 13;
      const inBottomLeft = r >= 13 && c < 8;

      if (!inTopLeft && !inTopRight && !inBottomLeft) {
        const seed = Math.sin((r * matrixSize + c + Math.abs(hash)) * 1337.5) * 10000;
        matrix[r][c] = (seed - Math.floor(seed)) > 0.45;
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <div className="bg-white p-3 rounded-xl shadow-md inline-block">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0B0F19"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
