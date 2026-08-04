/**
 * 与 @kne/react-filter useSearchParamsValue 内部解析保持一致（不从该包导出）。
 *
 * fields 项：`name` 为 URL key；`label` 为筛选项标题；可选 `labelKey` 为选中值展示文案的 URL key。
 *
 * @param {Object} [options]
 * @param {URLSearchParams} [options.searchParams]
 * @param {Array<{ name: string, label?: string, labelKey?: string }>} [options.fields]
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

    let valueText = raw;
    const labelKey = field.labelKey;
    if (labelKey && searchParams.has(labelKey)) {
      const fromLabelKey = searchParams.get(labelKey);
      if (fromLabelKey != null && fromLabelKey !== '') {
        valueText = fromLabelKey;
        consumedKeys.push(labelKey);
      }
    }

    const label = field.label != null ? field.label : name;
    items.push({
      name,
      label,
      value: { label: valueText, value: raw }
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

const parsePositiveInt = raw => {
  if (raw == null || raw === '') {
    return undefined;
  }
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    return undefined;
  }
  return Math.floor(num);
};

/**
 * 从 URL 读取分页状态（非法数字忽略）。
 * @param {URLSearchParams} [searchParams]
 * @param {{ currentName?: string, pageSizeName?: string }} [options]
 * @returns {{ current?: number, pageSize?: number }}
 */
export const parsePaginationSearchParams = (searchParams, { currentName = 'currentPage', pageSizeName = 'perPage' } = {}) => {
  const result = {};
  if (!searchParams) {
    return result;
  }
  const current = parsePositiveInt(searchParams.get(currentName));
  const pageSize = parsePositiveInt(searchParams.get(pageSizeName));
  if (current != null) {
    result.current = current;
  }
  if (pageSize != null) {
    result.pageSize = pageSize;
  }
  return result;
};

/**
 * 写入分页参数到 URL，保留其它 query。
 * @param {URLSearchParams} [searchParams]
 * @param {{ current?: number, pageSize?: number, currentName?: string, pageSizeName?: string }} options
 * @returns {URLSearchParams}
 */
export const patchPaginationSearchParams = (searchParams, { current, pageSize, currentName = 'currentPage', pageSizeName = 'perPage' } = {}) => {
  const next = new URLSearchParams(searchParams);
  if (current != null) {
    next.set(currentName, String(current));
  }
  if (pageSize != null) {
    next.set(pageSizeName, String(pageSize));
  }
  return next;
};

/**
 * @param {object} [pagination]
 * @returns {boolean}
 */
export const isPaginationSearchParamsEnabled = pagination => {
  return !!(pagination?.searchParams && typeof pagination.setSearchParams === 'function');
};
