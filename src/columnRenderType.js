import { globalParams } from './globalParams';
import './renderType';

export const SIZE_NAMES = ['short', 'small', 'large'];

const typeSize = {
  main: {
    width: 300,
    min: 160,
    max: 500,
    ellipsis: true
  },
  amount: {
    width: 140,
    min: 100,
    max: 300,
    ellipsis: true
  },
  options: {
    width: 180,
    min: 120,
    max: 400
  },
  enum: {
    width: 140,
    min: 100,
    max: 400
  },
  tag: {
    width: 140,
    min: 100,
    max: 400
  },
  tagList: {
    width: 300,
    min: 160,
    max: 500
  },
  list: {
    width: 200,
    min: 120,
    max: 400,
    ellipsis: true
  },
  description: {
    width: 400,
    min: 160,
    max: 600,
    ellipsis: true
  }
};

const SIZE_CONFIG = {
  short: {
    width: 120,
    min: 100,
    max: 400
  },
  small: {
    width: 100,
    min: 70,
    max: 400
  },
  default: {
    width: 300,
    min: 160,
    max: 500
  },
  large: {
    width: 300,
    min: 120,
    max: 500
  }
};

const getRenderTypeRegistry = () => {
  const { default: defaultRender, ...renderers } = globalParams.renderType || {};
  return { defaultRender, renderers };
};

export const getRenderTypeNames = () => Object.keys(getRenderTypeRegistry().renderers);

export const RENDER_TYPE_NAMES = getRenderTypeNames();

const getRender = type => {
  const { defaultRender, renderers } = getRenderTypeRegistry();
  return renderers[type] || defaultRender;
};

export const getColumnRender = column => {
  if (typeof column?.render === 'function') {
    return column.render;
  }
  const { type } = parseRenderType(column?.renderType);
  if (!type) {
    return null;
  }
  return getRender(type);
};

const getTypeConfigMap = () => {
  const extraTypeSize = globalParams.renderTypeSize || {};

  return getRenderTypeNames().reduce((result, key) => {
    result[key] = Object.assign({}, typeSize[key], extraTypeSize[key], { render: getRender(key) });
    return result;
  }, {});
};

const pickDimension = (columnValue, typeValue, sizeValue) => {
  if (columnValue != null) {
    return columnValue;
  }
  if (sizeValue != null) {
    return sizeValue;
  }
  if (typeValue != null) {
    return typeValue;
  }
  return undefined;
};

export const parseRenderType = renderTypeValue => {
  if (!renderTypeValue || typeof renderTypeValue !== 'string') {
    return { type: null, size: null };
  }

  const renderTypeNames = getRenderTypeNames();
  let type = null;
  let size = null;

  renderTypeValue.split('-').forEach(part => {
    if (!part) {
      return;
    }
    if (renderTypeNames.includes(part)) {
      type = part;
      return;
    }
    if (SIZE_NAMES.includes(part)) {
      size = part;
    }
  });

  return { type, size };
};

export const getRenderTypeDimensions = renderTypeValue => {
  const { type, size } = parseRenderType(renderTypeValue);
  const typeConfigMap = getTypeConfigMap();
  const typeConfig = type ? typeConfigMap[type] : null;
  const sizeConfig = size ? SIZE_CONFIG[size] : null;

  if (!typeConfig && !sizeConfig) {
    return null;
  }

  return {
    type,
    size,
    typeConfig,
    sizeConfig,
    render: typeConfig?.render,
    ellipsis: typeConfig?.ellipsis
  };
};

export const resolveColumnDimensions = column => {
  const renderTypeDimensions = column?.renderType ? getRenderTypeDimensions(column.renderType) : null;
  const typeConfig = renderTypeDimensions?.typeConfig;
  const sizeConfig = renderTypeDimensions?.sizeConfig;

  return {
    width: pickDimension(column?.width, typeConfig?.width, sizeConfig?.width),
    min: pickDimension(column?.min, typeConfig?.min, sizeConfig?.min),
    max: pickDimension(column?.max, typeConfig?.max, sizeConfig?.max)
  };
};

export const resolveRenderType = renderTypeValue => {
  const renderTypeDimensions = getRenderTypeDimensions(renderTypeValue);
  if (!renderTypeDimensions) {
    return null;
  }

  const { type, size, render, ellipsis, typeConfig, sizeConfig } = renderTypeDimensions;

  return {
    type,
    size,
    render,
    ellipsis,
    width: sizeConfig?.width ?? typeConfig?.width,
    min: sizeConfig?.min ?? typeConfig?.min,
    max: sizeConfig?.max ?? typeConfig?.max
  };
};

const ELLIPSIS_HANDLED_TYPES = ['main', 'amount'];
const FULL_WIDTH_CELL_TYPES = ['options'];

export const resolveColumn = column => {
  if (!column) {
    return column;
  }

  const renderTypeDimensions = column.renderType ? getRenderTypeDimensions(column.renderType) : null;
  const { width, min, max } = resolveColumnDimensions(column);
  const { ellipsis, type } = renderTypeDimensions || {};
  const renderFn = getColumnRender(column);

  return Object.assign({}, column, {
    ...(renderFn && typeof column.render !== 'function' ? { render: renderFn } : {}),
    ...(column.width == null && width != null ? { width } : {}),
    ...(column.min == null && min != null ? { min } : {}),
    ...(column.max == null && max != null ? { max } : {}),
    ...(column.ellipsis == null && ellipsis != null ? { ellipsis } : {}),
    ...(type && ELLIPSIS_HANDLED_TYPES.includes(type) ? { ellipsisHandledByRender: true } : {}),
    ...(type && FULL_WIDTH_CELL_TYPES.includes(type) ? { cellFullWidth: true } : {}),
    ...(column.type === 'options' && !type ? { cellFullWidth: true } : {}),
    ...(type === 'options' && column.type !== 'options' ? { type: 'options' } : {})
  });
};

export const resolveColumns = columns => (columns || []).map(resolveColumn);

export const isOptionsColumn = column => {
  if (column?.type === 'options') {
    return true;
  }
  return parseRenderType(column?.renderType).type === 'options';
};
