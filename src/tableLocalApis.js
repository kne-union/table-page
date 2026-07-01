import get from 'lodash/get';

const storageKey = 'TABLE_PAGE_TABLE_CONFIG';

const readStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
};

const writeStorage = data => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
};

const getData = name => {
  if (!name) {
    return {};
  }
  return get(readStorage(), name, {});
};

const setData = (name, data) => {
  if (!name) {
    return;
  }
  writeStorage(Object.assign({}, readStorage(), { [name]: data }));
};

const tableLocalApis = { getData, setData };

export default tableLocalApis;
