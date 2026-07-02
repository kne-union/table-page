import get from 'lodash/get';

export const getColumnConfig = (config, columnName, field, defaultValue) => {
  const columnConfig = config?.[columnName];
  if (columnConfig != null && columnConfig[field] !== undefined) {
    return columnConfig[field];
  }
  const legacyValue = get(config, `${columnName}.${field}`);
  return legacyValue === undefined ? defaultValue : legacyValue;
};

export const setColumnConfig = (config, columnName, updates) => {
  return Object.assign({}, config, {
    [columnName]: Object.assign({}, config?.[columnName], updates)
  });
};
