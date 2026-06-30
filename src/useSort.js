import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import clone from 'lodash/clone';
import { useCallback, useMemo, useState } from 'react';
import get from 'lodash/get';
import style from './sort.module.scss';

const sortArrayToMap = sort =>
  new Map(
    (sort || []).map(item => {
      return [item.name, item.sort];
    })
  );

const useControlValue = ({ value, defaultValue, onChange }) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const setValue = useCallback(
    updater => {
      const nextValue = typeof updater === 'function' ? updater(currentValue) : updater;
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange && onChange(nextValue);
    },
    [currentValue, isControlled, onChange]
  );

  return [currentValue, setValue];
};

const compareValues = (a, b, direction) => {
  const emptyA = a == null || a === '';
  const emptyB = b == null || b === '';
  if (emptyA && emptyB) {
    return 0;
  }
  if (emptyA) {
    return 1;
  }
  if (emptyB) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'ASC' ? a - b : b - a;
  }
  const strA = String(a);
  const strB = String(b);
  return direction === 'ASC' ? strA.localeCompare(strB, 'zh-CN') : strB.localeCompare(strA, 'zh-CN');
};

export const sortDataSource = (dataSource, sort = [], columns = []) => {
  if (!sort?.length || !dataSource?.length) {
    return dataSource;
  }
  const columnMap = new Map(columns.map(column => [column.name, column]));
  return [...dataSource].sort((a, b) => {
    for (const { name, sort: direction } of sort) {
      const column = columnMap.get(name) || { name };
      const aVal = typeof column.getValueOf === 'function' ? column.getValueOf(a, { column }) : get(a, name);
      const bVal = typeof column.getValueOf === 'function' ? column.getValueOf(b, { column }) : get(b, name);
      const result = compareValues(aVal, bVal, direction);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  });
};

export const getSortSingle = sortOption => {
  if (typeof sortOption === 'object') {
    return sortOption.single !== false;
  }
  return true;
};

export const renderColumnTitle = (title, column, sortRender) => {
  if (!column.sort || typeof sortRender !== 'function') {
    return title;
  }
  return (
    <span className={classnames(style['title'], style['has-sort'])}>
      <span className={style['title-text']}>{title}</span>
      {sortRender({
        name: column.name,
        single: getSortSingle(column.sort)
      })}
    </span>
  );
};

const useSort = props => {
  const [sort, setSort] = useControlValue({
    value: props.sort,
    defaultValue: props.defaultSort || [],
    onChange: props.onSortChange
  });

  const mapSort = useMemo(() => {
    return sortArrayToMap(sort);
  }, [sort]);

  const setMapSort = useCallback(
    callback => {
      return setSort(currentSort => {
        const newSort = callback(sortArrayToMap(currentSort));
        return Array.from(newSort).map(([name, sortValue]) => ({ name, sort: sortValue }));
      });
    },
    [setSort]
  );

  const sortRender = useCallback(
    ({ single, name }) => {
      const direction = mapSort.get(name);
      return (
        <span
          className={style['sort-btn']}
          onClick={e => {
            e.stopPropagation();
            setMapSort(sortMap => {
              const current = sortMap.get(name);
              const targetValue = (() => {
                if (current === 'DESC') {
                  return 'ASC';
                }
                if (current === 'ASC') {
                  return null;
                }
                return 'DESC';
              })();
              if (single) {
                return new Map(targetValue ? [[name, targetValue]] : []);
              }
              const newSort = clone(sortMap);
              targetValue ? newSort.set(name, targetValue) : newSort.delete(name);
              return newSort;
            });
          }}
        >
          <CaretUpOutlined
            className={classnames(style['sort-icon'], style['sort-up'], {
              [style['active']]: direction === 'ASC'
            })}
          />
          <CaretDownOutlined
            className={classnames(style['sort-icon'], style['sort-down'], {
              [style['active']]: direction === 'DESC'
            })}
          />
        </span>
      );
    },
    [mapSort, setMapSort]
  );

  return {
    sort,
    setSort,
    sortRender
  };
};

useSort.sortDataSource = sortDataSource;

export default useSort;
