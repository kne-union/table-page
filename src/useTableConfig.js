import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useRefCallback from '@kne/use-ref-callback';
import classnames from 'classnames';
import get from 'lodash/get';
import transform from 'lodash/transform';
import pick from 'lodash/pick';
import findLastIndex from 'lodash/findLastIndex';
import isEqual from 'lodash/isEqual';
import { Col, Popover, Row } from 'antd';
import { HolderOutlined, SettingOutlined } from '@ant-design/icons';
import { useDebouncedCallback } from 'use-debounce';
import ColumnsControlContent from './ColumnsControlContent';
import tableLocalApis from './tableLocalApis';
import { parseColumnWidth } from './TableView/columnWidth';
import configStyle from './columnConfig.module.scss';
import { TABLE_CONFIG_COLUMN_EXTRA_WIDTH } from './columnConfigExtra';

const DEFAULT_WIDTH = 160;
const DEFAULT_MIN = 80;
const DEFAULT_MAX = 600;

export const getColumnSize = column => {
  const width = parseColumnWidth(column.width) || DEFAULT_WIDTH;
  return {
    width,
    min: column.min ?? DEFAULT_MIN,
    max: column.max ?? DEFAULT_MAX
  };
};

const getConfigColumnExtraWidth = (index, columnCount, controllerOpen) => {
  if (!controllerOpen || index !== columnCount - 1) {
    return 0;
  }
  return TABLE_CONFIG_COLUMN_EXTRA_WIDTH;
};

const withConfigColumnExtra = (contentWidth, index, columnCount, controllerOpen) => {
  return contentWidth + getConfigColumnExtraWidth(index, columnCount, controllerOpen);
};

const TableConfigButton = ({ title, columns, config, setConfig }) => {
  const [open, setOpen] = useState(false);
  return (
    <Row wrap={false} align="middle" className={configStyle['table-config-header']}>
      <Col flex={1} className={configStyle['table-config-header-title']}>
        {title}
      </Col>
      <Col flex="none">
        <Popover
          open={open}
          onOpenChange={setOpen}
          trigger="click"
          placement="bottomLeft"
          rootClassName={configStyle['columns-control-overlay']}
          styles={{ container: { padding: 0 } }}
          content={
            <ColumnsControlContent
              columns={columns}
              config={config}
              close={() => setOpen(false)}
              onConfirm={newConfig => {
                setConfig(configValue => {
                  return transform(
                    newConfig,
                    (result, value, key) => {
                      result[key] = Object.assign({}, configValue[key], pick(value, ['visible', 'rank']));
                    },
                    {}
                  );
                });
              }}
            />
          }
        >
          <span className={classnames(configStyle['table-changer-setting'], open && configStyle['is-active'])}>
            <SettingOutlined />
          </span>
        </Popover>
      </Col>
    </Row>
  );
};

const useTableConfig = ({ columns, name, controllerOpen = true, tableWidth = 0, rowKey, tableServerApis = tableLocalApis }) => {
  const [currentMoveColumnIndex, setCurrentMoveColumnIndex] = useState(null);
  const currentMoveColumnIndexRef = useRef(currentMoveColumnIndex);
  currentMoveColumnIndexRef.current = currentMoveColumnIndex;
  const currentMoveColumnRef = useRef(null);
  const startPointRef = useRef(null);
  const [config, setConfigBase] = useState({});

  const saveConfig = useDebouncedCallback((tableName, target) => {
    tableServerApis?.setData(tableName, target);
  }, 500);

  const setConfig = useCallback(
    newConfig => {
      setConfigBase(prevConfig => {
        const target = typeof newConfig === 'function' ? newConfig(prevConfig) : newConfig;
        if (name && controllerOpen) {
          saveConfig(name, target);
        }
        return target;
      });
    },
    [name, controllerOpen, saveConfig]
  );

  useEffect(() => {
    if (name && controllerOpen) {
      setConfigBase(Object.assign({}, tableServerApis.getData(name)));
    }
  }, [name, controllerOpen, tableServerApis]);

  const visibleColumns = useMemo(() => {
    return columns
      .filter(col => !(get(config, `${col.name}.visible`) === false || (get(config, `${col.name}.visible`) !== true && col.hidden === true)))
      .sort((a, b) => {
        const computedIndex = item => get(config, `${item.name}.rank`, 0) + (item.fixed === 'left' || item.fixed === true ? -10000 : 0) + (item.fixed === 'right' ? 10000 : 0);
        return computedIndex(a) - computedIndex(b);
      });
  }, [columns, config]);

  const columnCount = visibleColumns.length;

  const hasFixedColumn = useMemo(() => visibleColumns.some(col => col.fixed === 'right' || col.fixed === 'left' || col.fixed === true), [visibleColumns]);

  const lastNotFixedColumnIndex = useMemo(() => {
    return findLastIndex(visibleColumns, col => col.fixed !== 'right' && col.type !== 'options');
  }, [visibleColumns]);

  const totalWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col, index) => {
      const { width } = getColumnSize(col);
      const contentWidth = get(config, `${col.name}.width`) || width;
      return sum + withConfigColumnExtra(contentWidth, index, columnCount, controllerOpen);
    }, 0);
  }, [visibleColumns, config, columnCount, controllerOpen]);

  const computedRealWidth = useCallback(
    ({ width, index }) => {
      const contentWidth = width;
      if (currentMoveColumnIndex !== null && currentMoveColumnIndex === index) {
        return withConfigColumnExtra(contentWidth, index, columnCount, controllerOpen);
      }
      if (hasFixedColumn || lastNotFixedColumnIndex !== index) {
        return withConfigColumnExtra(contentWidth, index, columnCount, controllerOpen);
      }
      return withConfigColumnExtra(contentWidth, index, columnCount, controllerOpen) + Math.max(tableWidth - totalWidth - 2, 0);
    },
    [hasFixedColumn, lastNotFixedColumnIndex, tableWidth, totalWidth, currentMoveColumnIndex, columnCount, controllerOpen]
  );

  const getConfigWidth = useCallback(
    column => {
      const { width, min, max } = getColumnSize(column);
      const currentWidth = Math.min(Math.max(get(config, `${column.name}.width`) || width, min), max);
      return { currentWidth, min, max };
    },
    [config]
  );

  const resizeBarRender = useCallback(
    (column, index) => {
      return (
        <span
          className={classnames(configStyle['cell-resize-bar'], 'table-cell-resize-bar')}
          onMouseDown={e => {
            e.stopPropagation();
            const { currentWidth, min, max } = getConfigWidth(column);
            currentMoveColumnRef.current = Object.assign({}, column, { index, width: currentWidth, min, max });
            startPointRef.current = e.clientX;
            setCurrentMoveColumnIndex(index);
          }}
        >
          <HolderOutlined />
        </span>
      );
    },
    [getConfigWidth]
  );

  const resize = useRefCallback(delta => {
    if (currentMoveColumnIndexRef.current === null || !currentMoveColumnRef.current) {
      return;
    }
    const { name: colName, width, min, max } = currentMoveColumnRef.current;
    const currentWidth = Math.min(Math.max(width + delta, min), max);
    if (currentWidth < min) {
      return;
    }
    setConfig(prevConfig =>
      Object.assign({}, prevConfig, {
        [colName]: Object.assign({}, prevConfig[colName], { width: currentWidth })
      })
    );
  });

  const renderColumnTitle = useCallback(
    (title, column, index, { withResize = true, withConfig = false } = {}) => {
      const titleNode = withConfig ? <TableConfigButton title={title} columns={columns} config={config} setConfig={setConfig} /> : title;
      const content = (
        <>
          {titleNode}
          {withResize && controllerOpen && resizeBarRender(column, index)}
        </>
      );
      if (!withResize || !controllerOpen) {
        return content;
      }
      return <span className={configStyle['header-cell-inner']}>{content}</span>;
    },
    [columns, config, controllerOpen, resizeBarRender, setConfig]
  );

  const getHeaderCellClassName = useCallback(
    index =>
      classnames(configStyle['header-col'], {
        'is-moving': currentMoveColumnIndexRef.current === index
      }),
    []
  );

  const computedColumnProps = useCallback(
    (column, index, { title }) => {
      const { currentWidth } = getConfigWidth(column);
      const realWidth = computedRealWidth({ width: currentWidth, index });
      const isLastColumn = index === columnCount - 1;

      const movingClass = () => ({
        className: classnames({
          'is-moving': currentMoveColumnIndex === index,
          'has-config-btn': isLastColumn && controllerOpen
        })
      });

      return {
        onHeaderCell: movingClass,
        onCell: movingClass,
        width: realWidth,
        shouldCellUpdate: (record, prevRecord) => {
          const itemKey = typeof rowKey === 'function' ? rowKey(record) : record[rowKey];
          const prevItemKey = typeof rowKey === 'function' ? rowKey(prevRecord) : prevRecord[rowKey];
          return currentMoveColumnIndexRef.current === null || currentMoveColumnIndexRef.current === index || !(itemKey === prevItemKey && isEqual(record[column.name], prevRecord[column.name]));
        },
        title: renderColumnTitle(title, column, index, {
          withResize: true,
          withConfig: isLastColumn && controllerOpen
        })
      };
    },
    [columnCount, controllerOpen, computedRealWidth, getConfigWidth, renderColumnTitle, rowKey, currentMoveColumnIndex]
  );

  useEffect(() => {
    const handlerCancelResize = () => {
      setCurrentMoveColumnIndex(null);
      startPointRef.current = null;
      currentMoveColumnRef.current = null;
    };

    const handlerResize = e => {
      if (currentMoveColumnIndexRef.current === null || currentMoveColumnRef.current === null || startPointRef.current === null) {
        return;
      }
      resize(e.clientX - startPointRef.current);
    };

    document.documentElement.addEventListener('mouseup', handlerCancelResize, true);
    document.documentElement.addEventListener('mousemove', handlerResize, true);
    return () => {
      document.documentElement.removeEventListener('mouseup', handlerCancelResize, true);
      document.documentElement.removeEventListener('mousemove', handlerResize, true);
    };
  }, [resize]);

  return {
    visibleColumns,
    columnsConfig: config,
    setConfig,
    currentMoveColumnIndex,
    totalWidth,
    hasFixedColumn,
    computedColumnProps,
    renderColumnTitle,
    getHeaderCellClassName,
    getConfigWidth,
    computedRealWidth,
    resizeBarRender
  };
};

export default useTableConfig;
