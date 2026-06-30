export const parseColumnWidth = width => {
  if (width == null) {
    return 0;
  }
  if (typeof width === 'number' && !Number.isNaN(width)) {
    return width;
  }
  if (typeof width === 'string') {
    const trimmed = width.trim();
    const pxMatch = trimmed.match(/^([\d.]+)px$/i);
    if (pxMatch) {
      return parseFloat(pxMatch[1]);
    }
    const num = parseFloat(trimmed);
    if (!Number.isNaN(num)) {
      return num;
    }
  }
  return 0;
};

export const getColumnWidthPx = (column, colsSize = {}) => {
  const configured = parseColumnWidth(column.width);
  const measured = colsSize[column.name] || 0;
  return Math.max(measured, configured);
};

export const formatColumnWidthPx = px => `${px}px`;
