import { resolveColumnDimensions } from '../columnRenderType';

export const SELECTION_CHECKBOX_WIDTH = 48;
export const SELECTION_RADIO_WIDTH = 30;

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

export const getResolvedColumnWidth = column => resolveColumnDimensions(column).width;

export const hasColumnWidth = column => parseColumnWidth(getResolvedColumnWidth(column)) > 0;

export const getColumnWidthPx = (column, colsSize = {}) => {
  const configured = parseColumnWidth(getResolvedColumnWidth(column));
  if (configured > 0) {
    return configured;
  }
  const measured = colsSize[column.name] || 0;
  return measured;
};

export const formatColumnWidthPx = px => `${px}px`;

export const getColumnTrackSize = (column, { defaultSpan, colsSize } = {}) => {
  const widthPx = getColumnWidthPx(column, colsSize);
  if (hasColumnWidth(column)) {
    return `${widthPx}px`;
  }
  if (widthPx > 0) {
    return `minmax(${widthPx}px, 1fr)`;
  }
  const span = column.span ?? defaultSpan ?? 1;
  return `minmax(0, ${span}fr)`;
};

export const getGridTemplateColumns = (columns, { defaultSpan, colsSize, rowSelection } = {}) => {
  const tracks = [];

  if (rowSelection?.type === 'checkbox') {
    tracks.push(`${SELECTION_CHECKBOX_WIDTH}px`);
  }

  columns.forEach(column => {
    tracks.push(getColumnTrackSize(column, { defaultSpan, colsSize }));
  });

  if (rowSelection?.type === 'radio') {
    tracks.push(`${SELECTION_RADIO_WIDTH}px`);
  }

  return tracks.join(' ');
};

export const getColumnLayout = (column, { defaultSpan, colsSize } = {}) => {
  const widthBased = hasColumnWidth(column);
  const widthPx = getColumnWidthPx(column, colsSize);

  return {
    widthBased,
    style: {
      '--col-width': formatColumnWidthPx(widthPx),
      '--col-align': column.align || 'top',
      '--col-justify': column.justify || 'flex-start'
    }
  };
};
