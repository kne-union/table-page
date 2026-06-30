import { useCallback, useMemo, useState } from 'react';
import get from 'lodash/get';

const useSelectedRow = options => {
  const { rowKey, type = 'checkbox' } = Object.assign({}, { rowKey: 'id' }, options);
  const [selectedRows, setSelectedRows] = useState([]);

  const getRowId = useCallback(item => get(item, typeof rowKey === 'function' ? rowKey(item) : rowKey), [rowKey]);

  const selectedRowKeys = useMemo(() => selectedRows.map(getRowId), [getRowId, selectedRows]);

  const setSelectedRowKeys = useCallback(
    (keys, dataSource = []) => {
      const keySet = new Set(keys || []);
      setSelectedRows((dataSource || []).filter(item => keySet.has(getRowId(item))));
    },
    [getRowId]
  );

  const clearSelectedRows = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const onSelectAll = useCallback(
    (checked, _selected, items) => {
      const ids = (items || []).map(getRowId);
      if (checked) {
        setSelectedRows(value => {
          const existingKeys = value.map(getRowId);
          return [...value, ...(items || []).filter(item => existingKeys.indexOf(getRowId(item)) === -1)];
        });
      } else {
        setSelectedRows(value => {
          return value.filter(item => ids.indexOf(getRowId(item)) === -1);
        });
      }
    },
    [getRowId]
  );

  const onSelect = useCallback(
    (item, checked) => {
      if (checked) {
        if (type === 'radio') {
          setSelectedRows([item]);
          return;
        }
        setSelectedRows(value => {
          const newValue = value.slice(0);
          newValue.push(item);
          return newValue;
        });
      } else {
        setSelectedRows(value => {
          const newValue = value.slice(0);
          const index = newValue.findIndex(row => getRowId(row) === getRowId(item));
          if (index > -1) {
            newValue.splice(index, 1);
          }
          return newValue;
        });
      }
    },
    [getRowId, type]
  );

  const getRowSelection = useCallback(
    (dataSource, extra = {}) => {
      const onChange = (keys, id, meta) => {
        setSelectedRowKeys(keys, dataSource);
        extra.onChange && extra.onChange(keys, id, meta);
      };

      return Object.assign(
        {
          type,
          selectedRowKeys,
          allowSelectedAll: type === 'checkbox',
          onChange
        },
        extra
      );
    },
    [selectedRowKeys, setSelectedRowKeys, type]
  );

  return {
    type,
    selectedRowKeys,
    selectedRows,
    onSelectAll,
    onSelect,
    setSelectedRows,
    setSelectedRowKeys,
    clearSelectedRows,
    getRowSelection
  };
};

export default useSelectedRow;
