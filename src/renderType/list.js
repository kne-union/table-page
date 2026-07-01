const DEFAULT_SPLIT = ',';

const normalizeListValue = value => {
  if (Array.isArray(value)) {
    return { items: value, split: undefined };
  }
  if (value && typeof value === 'object') {
    const items = value.items ?? value.list ?? value.value;
    if (Array.isArray(items)) {
      return { items, split: value.split };
    }
  }
  return null;
};

const getListItemText = item => {
  if (item == null) {
    return null;
  }
  if (typeof item === 'object') {
    return item.text ?? item.label ?? item.children ?? item.value;
  }
  return item;
};

const list = (value, { column } = {}) => {
  const normalized = normalizeListValue(value);
  if (!normalized) {
    return value == null ? null : value;
  }

  const split = normalized.split ?? column?.split ?? DEFAULT_SPLIT;
  const text = normalized.items
    .map(getListItemText)
    .filter(item => item != null && item !== '')
    .join(split);

  return text || null;
};

export default list;
