/**
 * 与 @kne/react-filter useSearchParamsValue 内部解析保持一致（不从该包导出）。
 *
 * @param {Object} [options]
 * @param {URLSearchParams} [options.searchParams]
 * @param {Array<{ name: string, label?: string }>} [options.fields]
 * @returns {{ items: Array, consumedKeys: string[] }}
 */
export const parseSearchParamsValue = ({ searchParams, fields } = {}) => {
  const items = [];
  const consumedKeys = [];

  if (!searchParams || !Array.isArray(fields) || fields.length === 0) {
    return { items, consumedKeys };
  }

  fields.forEach(field => {
    const name = field?.name;
    if (!name || !searchParams.has(name)) {
      return;
    }
    const raw = searchParams.get(name);
    if (raw == null || raw === '') {
      return;
    }
    consumedKeys.push(name);
    const label = field.label != null ? field.label : name;
    items.push({
      name,
      label,
      value: { label: raw, value: raw }
    });
  });

  return { items, consumedKeys };
};

/**
 * 按 name 合并筛选数组；同名时 fromUrl 覆盖 base。
 * @param {Array} base
 * @param {Array} fromUrl
 * @returns {Array}
 */
export const mergeFilterByName = (base = [], fromUrl = []) => {
  if (!fromUrl.length) {
    return Array.isArray(base) ? [...base] : [];
  }
  const map = new Map();
  (base || []).forEach(item => {
    if (item?.name) {
      map.set(item.name, item);
    }
  });
  fromUrl.forEach(item => {
    if (item?.name) {
      map.set(item.name, item);
    }
  });
  return Array.from(map.values());
};

/**
 * @param {URLSearchParams} searchParams
 * @param {string[]} consumedKeys
 * @returns {URLSearchParams|null}
 */
export const stripConsumedUrlParams = (searchParams, consumedKeys) => {
  if (!consumedKeys?.length) {
    return null;
  }
  const next = new URLSearchParams(searchParams);
  let changed = false;
  consumedKeys.forEach(key => {
    if (next.has(key)) {
      next.delete(key);
      changed = true;
    }
  });
  return changed ? next : null;
};
