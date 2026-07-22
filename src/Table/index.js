import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Empty, Radio, Table as AntTable } from 'antd';
import classnames from 'classnames';
import get from 'lodash/get';
import {
  buildClearSelectAllKeys,
  buildSelectAllKeys,
  computeColumnsValue,
  computeDisplay,
  flattenVisibleTree,
  getColumnEllipsis,
  getTreeCheckState,
  getTreeSelectionColumnWidth,
  hasAnyTreeSelected,
  isAllTreeSelected,
  isRenderMobileActive,
  nodeCanExpand,
  parseColumnWidth,
  renderCellContent,
  renderColumnTitle,
  resolveCheckRelation,
  resolveColumns,
  toggleExpandedKey,
  toggleTreeCheck,
  useSelectedRow,
  useSort,
  wrapColumnHeaderTitle
} from '@kne/table-view';
import TableView from '../TableView';
import { isEmpty } from '@kne/is-empty';
import { useIsMobile } from '@kne/responsive-utils';
import style from './style.module.scss';
import useTableConfig from '../useTableConfig';
import useGroupHeader from '../useGroupHeader';
import useElementWidth from '../useElementWidth';
import { normalizeScrollTopInsetCSSValue, parseInsetPixels, resolveScrollTopInset } from '../TablePage/scrollUtils';
import { prepareAntdTreeData, resolveExpandedRowKeys, shouldLoadTreeChildren } from '../tableTree';
import TreeExpandContent from './TreeExpandContent';

const mapJustifyToAlign = justify => {
  if (justify === 'center') {
    return 'center';
  }
  if (justify === 'flex-end') {
    return 'right';
  }
  return 'left';
};

const resolveRowKey = (rowKey, record) => get(record, typeof rowKey === 'function' ? rowKey(record) : rowKey);

const toAntdWidth = width => {
  if (width == null) {
    return undefined;
  }
  if (typeof width === 'number') {
    return width;
  }
  const parsed = parseColumnWidth(width);
  return parsed || width;
};

const toAntdFixed = fixed => {
  if (fixed === 'right') {
    return 'right';
  }
  if (fixed === true || fixed === 'left') {
    return 'left';
  }
  return undefined;
};

const getColCellStyle = column => ({
  textAlign: mapJustifyToAlign(column.justify),
  verticalAlign: column.align === 'middle' ? 'middle' : column.align === 'bottom' ? 'bottom' : 'top'
});

const getAntCellClassName = (...extra) => classnames(style['table-cell'], 'info-page-table-col', ...extra);

const wrapColContent = node => <span className={style['col-content']}>{node}</span>;

const Table = p => {
  const tableRef = useRef(null);
  const tableWidth = useElementWidth(tableRef);
  const [isLayout, setIsLayout] = useState(true);
  const isMobile = useIsMobile();

  const props = Object.assign(
    {},
    {
      rowKey: 'id',
      valueIsEmpty: isEmpty,
      placeholder: '-',
      emptyIsPlaceholder: true,
      empty: <Empty />,
      controllerOpen: true,
      dataType: 'list',
      parentKey: 'parentId',
      childrenKey: 'children',
      hasChildrenKey: 'hasChildren',
      treeTitleKey: 'name',
      defaultExpandedKeys: false,
      indentSize: 16
    },
    p
  );
  const {
    className,
    dataSource,
    columns: columnsProp,
    rowKey,
    rowSelection,
    valueIsEmpty,
    emptyIsPlaceholder,
    placeholder,
    empty,
    onRowSelect,
    render,
    renderMobile = true,
    context,
    sticky,
    scrollTopInset,
    stickyOffset,
    getStickyContainer,
    headerStyle,
    pagination = false,
    sortRender,
    mobileSortToolbar,
    name,
    controllerOpen,
    tableServerApis,
    scroll,
    summary,
    size,
    dataType,
    parentKey,
    childrenKey,
    hasChildrenKey,
    treeTitleKey,
    onLoadChildren,
    expandedKeys: expandedKeysProp,
    defaultExpandedKeys,
    onExpandedKeysChange,
    indentSize,
    ...others
  } = props;
  const sizeClassName = size === 'small' ? style['is-size-small'] : size === 'large' ? style['is-size-large'] : null;
  const useMobileRender = isRenderMobileActive(renderMobile, isMobile);
  const isExpandedControlled = Object.prototype.hasOwnProperty.call(p, 'expandedKeys');
  const [innerExpandedKeys, setInnerExpandedKeys] = useState(defaultExpandedKeys);
  const expandedKeys = isExpandedControlled ? expandedKeysProp : innerExpandedKeys;
  const [loadingKeys, setLoadingKeys] = useState(() => new Set());
  const loadedKeysRef = useRef(new Set());

  const columns = useMemo(() => resolveColumns(columnsProp), [columnsProp]);

  const { isTree, treeData, expandableKeys, treeKeyMaps } = useMemo(
    () =>
      prepareAntdTreeData(dataSource, {
        dataType,
        rowKey,
        parentKey,
        childrenKey,
        hasChildrenKey
      }),
    [dataSource, dataType, rowKey, parentKey, childrenKey, hasChildrenKey]
  );
  const checkRelation = resolveCheckRelation(rowSelection?.checkRelation, { isTree, selectionType: rowSelection?.type });
  const tableDataSource = isTree ? treeData : dataSource;

  const handleExpandedChange = useCallback(
    nextKeys => {
      if (!isExpandedControlled) {
        setInnerExpandedKeys(nextKeys);
      }
      onExpandedKeysChange && onExpandedKeysChange(nextKeys);
    },
    [isExpandedControlled, onExpandedKeysChange]
  );

  const clearLoadingKey = key => {
    setLoadingKeys(prev => {
      if (!prev.has(key)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleLoadChildren = useCallback(
    record => {
      if (typeof onLoadChildren !== 'function') {
        return;
      }
      const key = resolveRowKey(rowKey, record);
      if (
        !shouldLoadTreeChildren(record, {
          key,
          childrenKey,
          hasChildrenKey,
          loadingKeys,
          loadedKeys: loadedKeysRef.current
        })
      ) {
        return;
      }
      setLoadingKeys(prev => new Set(prev).add(key));
      Promise.resolve(onLoadChildren(record, { key }))
        .catch(() => {})
        .finally(() => {
          loadedKeysRef.current.add(key);
          clearLoadingKey(key);
        });
    },
    [onLoadChildren, rowKey, childrenKey, hasChildrenKey, loadingKeys]
  );

  const expandedRowKeys = useMemo(() => (isTree ? resolveExpandedRowKeys(expandedKeys, expandableKeys) : undefined), [isTree, expandedKeys, expandableKeys]);

  const maxTreeLevel = useMemo(() => {
    if (!isTree) {
      return 0;
    }
    const displayRows = flattenVisibleTree(treeData, { rowKey, childrenKey, hasChildrenKey, expandedKeys });
    return displayRows.reduce((max, row) => Math.max(max, row.level || 0), 0);
  }, [isTree, treeData, rowKey, childrenKey, hasChildrenKey, expandedKeys]);

  const selectionColumnWidth = useMemo(
    () =>
      getTreeSelectionColumnWidth({
        indentSize,
        maxLevel: maxTreeLevel,
        rowSelection,
        isTree
      }),
    [indentSize, maxTreeLevel, rowSelection, isTree]
  );
  // antd 单元格会裁剪 overflow，树形选择列多留 2px 避免 checkbox 右边框被切
  const antdSelectionColumnWidth = isTree && selectionColumnWidth > 0 ? selectionColumnWidth + 2 : selectionColumnWidth;

  const handleToggleExpand = useCallback(
    (key, record) => {
      const wasExpanded = (expandedRowKeys || []).indexOf(key) > -1;
      const nextKeys = toggleExpandedKey(expandedKeys, key, expandableKeys);
      handleExpandedChange(nextKeys);
      if (!wasExpanded) {
        handleLoadChildren(record);
      }
    },
    [expandedRowKeys, expandedKeys, expandableKeys, handleExpandedChange, handleLoadChildren]
  );

  const getTreeRowMeta = useCallback(
    record => {
      const key = resolveRowKey(rowKey, record);
      const level = treeKeyMaps?.getAncestorKeys(key)?.length || 0;
      return {
        key,
        level,
        hasChildren: nodeCanExpand(record, { childrenKey, hasChildrenKey }),
        expanded: (expandedRowKeys || []).indexOf(key) > -1
      };
    },
    [rowKey, treeKeyMaps, childrenKey, hasChildrenKey, expandedRowKeys]
  );

  const antdExpandable = useMemo(() => {
    if (!isTree) {
      return others.expandable;
    }
    // 隐藏 antd 默认展开列，改用与 TableView 一致的自绘三角
    return Object.assign({}, others.expandable, {
      childrenColumnName: childrenKey,
      showExpandColumn: false,
      expandIcon: () => null,
      indentSize: 0,
      expandedRowKeys,
      onExpandedRowsChange: keys => {
        others.expandable?.onExpandedRowsChange?.(keys);
        handleExpandedChange(keys);
      }
    });
  }, [isTree, others.expandable, childrenKey, expandedRowKeys, handleExpandedChange]);

  useEffect(() => {
    if (tableWidth) {
      setTimeout(() => setIsLayout(false), 0);
    }
  }, [tableWidth]);

  const { visibleColumns, columnsConfig, currentMoveColumnIndex, totalWidth, computedColumnProps, hasFixedColumn } = useTableConfig({
    columns,
    name,
    controllerOpen,
    tableWidth,
    rowKey,
    tableServerApis
  });

  const [resizeGuideStyle, setResizeGuideStyle] = useState(null);

  const updateResizeGuide = useCallback(() => {
    if (currentMoveColumnIndex === null || !tableRef.current) {
      setResizeGuideStyle(null);
      return;
    }
    const root = tableRef.current;
    const headerCell = root.querySelector('.ant-table-thead .ant-table-cell.is-moving');
    const tableContainer = root.querySelector('.ant-table-container');
    if (!headerCell || !tableContainer) {
      setResizeGuideStyle(null);
      return;
    }
    const headerRect = headerCell.getBoundingClientRect();
    const resizeBar = headerCell.querySelector('.table-cell-resize-bar');
    const barRect = resizeBar?.getBoundingClientRect();
    const containerRect = tableContainer.getBoundingClientRect();
    setResizeGuideStyle({
      position: 'fixed',
      left: Math.round(barRect?.right ?? headerRect.right),
      top: Math.round(containerRect.top),
      height: Math.round(containerRect.height),
      zIndex: 100
    });
  }, [currentMoveColumnIndex]);

  useLayoutEffect(() => {
    updateResizeGuide();
  }, [updateResizeGuide, columnsConfig, tableWidth, dataSource, isLayout]);

  useEffect(() => {
    if (currentMoveColumnIndex === null) {
      return;
    }
    const handleUpdate = () => updateResizeGuide();
    window.addEventListener('mousemove', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);
    const resizeObserver = new ResizeObserver(handleUpdate);
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }
    return () => {
      window.removeEventListener('mousemove', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      resizeObserver.disconnect();
    };
  }, [currentMoveColumnIndex, updateResizeGuide]);

  const targetColumns = useMemo(() => visibleColumns.map((column, index) => Object.assign({}, column, { __index: index })), [visibleColumns]);

  const { columns: groupedColumns, hasGroupHeader } = useGroupHeader(targetColumns);

  const antdColumns = useMemo(() => {
    const buildLeafColumn = (column, index) => {
      const { name: colName, title, width, align, justify, fixed } = column;
      const baseColumn = {
        key: colName,
        dataIndex: colName,
        title: <span className={style['col-content']}>{renderColumnTitle(title, column, sortRender)}</span>,
        width: toAntdWidth(width),
        fixed: toAntdFixed(fixed),
        align: mapJustifyToAlign(justify),
        ellipsis: getColumnEllipsis(column),
        onHeaderCell: () => ({
          className: getAntCellClassName(),
          style: getColCellStyle(column)
        }),
        onCell: () => ({
          className: getAntCellClassName(),
          style: getColCellStyle(column)
        }),
        render: (_, record) => {
          const [computedColumn] = computeColumnsValue({
            columns: [column],
            emptyIsPlaceholder,
            valueIsEmpty,
            removeEmpty: false,
            dataSource: record,
            placeholder,
            context
          });
          if (!computedColumn) {
            return null;
          }
          return renderCellContent(computeDisplay({ column: computedColumn, placeholder, dataSource: record, context }), computedColumn, style['col-content']);
        }
      };

      if (!controllerOpen) {
        return baseColumn;
      }

      const configProps = computedColumnProps(column, index, {
        title: <span className={style['col-content']}>{renderColumnTitle(title, column, sortRender)}</span>
      });
      const antdFixed = toAntdFixed(fixed);

      return Object.assign({}, baseColumn, configProps, {
        width: configProps.width,
        fixed: antdFixed,
        onHeaderCell: () => ({
          className: getAntCellClassName(configProps.onHeaderCell?.().className),
          style: getColCellStyle(column)
        }),
        onCell: () => ({
          className: getAntCellClassName(configProps.onCell?.().className),
          style: getColCellStyle(column)
        })
      });
    };

    const mapColumn = column => {
      if (column.children && column.children.length > 0) {
        return {
          key: column.name,
          title: <span className={style['col-content']}>{wrapColumnHeaderTitle(column.title)}</span>,
          onHeaderCell: () => ({
            className: getAntCellClassName(),
            style: { textAlign: 'center', verticalAlign: 'middle' }
          }),
          children: column.children.map(mapColumn)
        };
      }
      return buildLeafColumn(column, column.__index);
    };

    const mapped = groupedColumns.map(mapColumn);
    if (!isTree || rowSelection) {
      return mapped;
    }

    const expandColumn = {
      key: '__tree_expand__',
      width: antdSelectionColumnWidth,
      fixed: hasFixedColumn ? 'left' : undefined,
      title: <TreeExpandContent level={0} indentSize={indentSize} hasChildren={false} />,
      onHeaderCell: () => ({
        className: getAntCellClassName(style['tree-expand-col'])
      }),
      onCell: () => ({
        className: getAntCellClassName(style['tree-expand-col'])
      }),
      render: (_, record) => {
        const meta = getTreeRowMeta(record);
        return <TreeExpandContent level={meta.level} indentSize={indentSize} hasChildren={meta.hasChildren} expanded={meta.expanded} loading={loadingKeys.has(meta.key)} onExpand={() => handleToggleExpand(meta.key, record)} />;
      }
    };
    return [expandColumn, ...mapped];
  }, [
    groupedColumns,
    context,
    emptyIsPlaceholder,
    placeholder,
    sortRender,
    valueIsEmpty,
    controllerOpen,
    computedColumnProps,
    currentMoveColumnIndex,
    isTree,
    rowSelection,
    antdSelectionColumnWidth,
    hasFixedColumn,
    indentSize,
    getTreeRowMeta,
    loadingKeys,
    handleToggleExpand
  ]);

  const antdRowSelection = useMemo(() => {
    if (!rowSelection) {
      return undefined;
    }

    const getRowKey = record => resolveRowKey(rowKey, record);
    const allKeys = isTree ? treeKeyMaps?.allKeys || [] : (dataSource || []).filter(item => !item.disabled).map(getRowKey);
    const useTreeCheck = isTree && rowSelection.type === 'checkbox' && checkRelation !== 'independent' && treeKeyMaps;

    const renderSelectAllNode = () => {
      if (rowSelection.type !== 'checkbox') {
        return null;
      }
      if (!rowSelection.allowSelectedAll) {
        return <Checkbox style={{ visibility: 'hidden' }} />;
      }
      if (useTreeCheck) {
        const checkedAll = rowSelection.isSelectedAll ? true : isAllTreeSelected({ mode: checkRelation, maps: treeKeyMaps, selectedKeys: rowSelection.selectedRowKeys });
        const indeterminate = rowSelection.isSelectedAll ? false : !checkedAll && hasAnyTreeSelected({ mode: checkRelation, maps: treeKeyMaps, selectedKeys: rowSelection.selectedRowKeys });
        return (
          <Checkbox
            checked={checkedAll}
            indeterminate={indeterminate}
            onChange={e => {
              const checked = e.target.checked;
              if (typeof rowSelection.onIsSelectAllChange === 'function') {
                rowSelection.onIsSelectAllChange(checked);
                return;
              }
              const existing = rowSelection.selectedRowKeys || [];
              rowSelection.onChange(checked ? buildSelectAllKeys({ mode: checkRelation, maps: treeKeyMaps, existingKeys: existing }) : buildClearSelectAllKeys({ mode: checkRelation, maps: treeKeyMaps, existingKeys: existing }), undefined, {
                context,
                checked
              });
            }}
          />
        );
      }
      const checkedAll = rowSelection.isSelectedAll || (allKeys.length > 0 && allKeys.every(key => (rowSelection.selectedRowKeys || []).indexOf(key) > -1));
      const indeterminate = !checkedAll && (rowSelection.selectedRowKeys || []).length > 0;
      return (
        <Checkbox
          checked={checkedAll}
          indeterminate={indeterminate}
          onChange={e => {
            const checked = e.target.checked;
            if (typeof rowSelection.onIsSelectAllChange === 'function') {
              rowSelection.onIsSelectAllChange(checked);
              return;
            }
            const existing = rowSelection.selectedRowKeys || [];
            if (!checked) {
              rowSelection.onChange(
                existing.filter(key => allKeys.indexOf(key) === -1),
                undefined,
                { context, checked: false }
              );
              return;
            }
            const merged = existing.slice();
            allKeys.forEach(key => {
              if (merged.indexOf(key) === -1) {
                merged.push(key);
              }
            });
            rowSelection.onChange(merged, undefined, { context, checked: true });
          }}
        />
      );
    };

    const renderTreeSelectionControl = record => {
      const id = getRowKey(record);
      if (rowSelection.type === 'checkbox') {
        const state = useTreeCheck ? getTreeCheckState(id, rowSelection.selectedRowKeys, checkRelation, treeKeyMaps) : { checked: (rowSelection.selectedRowKeys || []).indexOf(id) > -1, indeterminate: false };
        return (
          <Checkbox
            disabled={record.disabled || rowSelection.isSelectedAll}
            checked={(rowSelection.isSelectedAll && !record.disabled) || state.checked}
            indeterminate={!rowSelection.isSelectedAll && !!state.indeterminate}
            onChange={e => {
              const nextChecked = e.target.checked;
              if (useTreeCheck) {
                const nextKeys = toggleTreeCheck({
                  key: id,
                  checked: nextChecked,
                  selectedKeys: rowSelection.selectedRowKeys || [],
                  mode: checkRelation,
                  maps: treeKeyMaps
                });
                rowSelection.onChange(nextKeys, id, { context, checked: nextChecked });
                return;
              }
              const selectedRowKeys = (rowSelection.selectedRowKeys || []).slice();
              if (nextChecked) {
                if (selectedRowKeys.indexOf(id) === -1) {
                  selectedRowKeys.push(id);
                }
              } else {
                const index = selectedRowKeys.indexOf(id);
                if (index > -1) {
                  selectedRowKeys.splice(index, 1);
                }
              }
              rowSelection.onChange(selectedRowKeys, id, { context, checked: nextChecked });
            }}
          />
        );
      }
      if (rowSelection.type === 'radio') {
        const checked = (rowSelection.selectedRowKeys || [])[0] === id;
        return (
          <Radio
            disabled={record.disabled}
            checked={checked}
            onChange={() => {
              rowSelection.onChange(checked ? [] : [id], id, { context, checked: !checked });
            }}
          />
        );
      }
      return null;
    };

    if (isTree) {
      const selectAllNode = rowSelection.type === 'checkbox' ? renderSelectAllNode() : null;
      return {
        type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
        preserveSelectedRowKeys: true,
        checkStrictly: true,
        hideSelectAll: true,
        columnWidth: antdSelectionColumnWidth,
        ...(hasFixedColumn ? { fixed: 'left' } : {}),
        selectedRowKeys: rowSelection.isSelectedAll ? allKeys : rowSelection.selectedRowKeys,
        onChange: () => {},
        getCheckboxProps: record => ({
          disabled: record.disabled || rowSelection.isSelectedAll
        }),
        columnTitle: <TreeExpandContent level={0} indentSize={indentSize} hasChildren={false} selection={selectAllNode} />,
        renderCell: (checked, record) => {
          const meta = getTreeRowMeta(record);
          return (
            <TreeExpandContent
              level={meta.level}
              indentSize={indentSize}
              hasChildren={meta.hasChildren}
              expanded={meta.expanded}
              loading={loadingKeys.has(meta.key)}
              onExpand={() => handleToggleExpand(meta.key, record)}
              selection={renderTreeSelectionControl(record)}
            />
          );
        },
        onCell: () => ({
          className: getAntCellClassName(style['selection-col'])
        })
      };
    }

    return {
      type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
      preserveSelectedRowKeys: true,
      ...(hasFixedColumn ? { fixed: 'left' } : {}),
      selectedRowKeys: rowSelection.isSelectedAll ? allKeys : rowSelection.selectedRowKeys,
      onChange: (selectedRowKeys, selectedRows, info) => {
        if (info.type === 'all') {
          const checked = selectedRowKeys.length > 0;
          if (typeof rowSelection.onIsSelectAllChange === 'function') {
            rowSelection.onIsSelectAllChange(checked);
            return;
          }
          const pageKeys = (dataSource || []).filter(item => !item.disabled).map(getRowKey);
          const existing = rowSelection.selectedRowKeys || [];
          if (!checked) {
            rowSelection.onChange(
              existing.filter(key => pageKeys.indexOf(key) === -1),
              undefined,
              { context, checked: false }
            );
            return;
          }
          const merged = existing.slice();
          pageKeys.forEach(key => {
            if (merged.indexOf(key) === -1) {
              merged.push(key);
            }
          });
          rowSelection.onChange(merged, undefined, { context, checked: true });
          return;
        }

        const currentKey = selectedRows.length > 0 ? getRowKey(selectedRows[selectedRows.length - 1]) : selectedRowKeys[selectedRowKeys.length - 1];
        const checked = selectedRowKeys.indexOf(currentKey) > -1;
        rowSelection.onChange(selectedRowKeys, currentKey, { context, checked });
      },
      getCheckboxProps: record => ({
        disabled: record.disabled || rowSelection.isSelectedAll
      }),
      ...(rowSelection.type === 'checkbox'
        ? {
            columnTitle: rowSelection.allowSelectedAll ? checkboxNode => wrapColContent(checkboxNode) : wrapColContent(<Checkbox style={{ visibility: 'hidden' }} />),
            renderCell: (checked, record, index, originNode) => wrapColContent(originNode),
            onCell: () => ({
              className: getAntCellClassName(style['selection-col'])
            })
          }
        : {
            columnWidth: 30,
            renderCell: (checked, record, index, originNode) => wrapColContent(originNode),
            onCell: () => ({
              className: getAntCellClassName(style['radio-col'])
            })
          })
    };
  }, [context, dataSource, rowKey, rowSelection, hasFixedColumn, isTree, treeKeyMaps, checkRelation, antdSelectionColumnWidth, indentSize, getTreeRowMeta, loadingKeys, handleToggleExpand]);

  const hasData = Array.isArray(tableDataSource) && tableDataSource.length > 0;

  const tableScroll = useMemo(() => {
    let x;
    if (hasFixedColumn) {
      x = totalWidth;
    } else if (controllerOpen) {
      x = Math.max(tableWidth, totalWidth);
    } else if (tableWidth && totalWidth > tableWidth) {
      // controllerOpen 关闭时列总宽超出容器也要开启横向滚动，避免列溢出
      x = totalWidth;
    }
    if (x != null && isTree && antdSelectionColumnWidth) {
      x += antdSelectionColumnWidth;
    }
    const nextScroll = Object.assign({}, x != null ? { x } : {}, scroll);
    if (!hasData && nextScroll.y != null) {
      const { y, ...rest } = nextScroll;
      return rest;
    }
    return nextScroll;
  }, [hasFixedColumn, controllerOpen, totalWidth, tableWidth, scroll, hasData, isTree, antdSelectionColumnWidth]);

  const hasScrollY = hasData && scroll?.y != null && scroll?.y !== false;
  const isStickyViewport = !!sticky && !hasScrollY;
  const resolvedScrollTopInset = resolveScrollTopInset(scrollTopInset, stickyOffset);

  const stickyGetContainer = useMemo(() => {
    if (!getStickyContainer || hasScrollY) {
      return undefined;
    }
    return () => getStickyContainer() || window;
  }, [getStickyContainer, hasScrollY]);

  const parsedScrollTopInset = useMemo(() => {
    if (!sticky || hasScrollY) {
      return 0;
    }
    return parseInsetPixels(resolvedScrollTopInset, tableRef.current);
  }, [sticky, hasScrollY, resolvedScrollTopInset, isLayout, dataSource]);

  const antdSticky = useMemo(() => {
    if (!sticky) {
      return undefined;
    }
    const config = typeof sticky === 'object' ? Object.assign({}, sticky) : {};
    if (hasScrollY) {
      const { getContainer, ...scrollSticky } = config;
      return Object.assign({ offsetHeader: 0 }, scrollSticky);
    }
    return Object.assign({ offsetHeader: parsedScrollTopInset }, config, stickyGetContainer ? { getContainer: stickyGetContainer } : null);
  }, [sticky, stickyGetContainer, hasScrollY, parsedScrollTopInset]);

  const tableWrapperStyle = useMemo(() => {
    const next = {};
    const cssValue = normalizeScrollTopInsetCSSValue(resolvedScrollTopInset);
    if (cssValue) {
      next['--scroll-top-inset'] = cssValue;
    }
    if (isTree && antdSelectionColumnWidth) {
      next['--selection-col-width'] = `${antdSelectionColumnWidth}px`;
    }
    return Object.keys(next).length > 0 ? next : undefined;
  }, [resolvedScrollTopInset, isTree, antdSelectionColumnWidth]);

  const useTreeCheckForRow = isTree && rowSelection?.type === 'checkbox' && checkRelation !== 'independent' && treeKeyMaps;

  if (useMobileRender) {
    return (
      <TableView
        {...others}
        className={classnames(className, style['is-mobile-render'])}
        dataSource={dataSource}
        columns={visibleColumns}
        rowKey={rowKey}
        rowSelection={rowSelection}
        valueIsEmpty={valueIsEmpty}
        emptyIsPlaceholder={emptyIsPlaceholder}
        placeholder={placeholder}
        empty={empty}
        onRowSelect={onRowSelect}
        renderMobile={renderMobile}
        context={context}
        sortRender={sortRender}
        mobileSortToolbar={mobileSortToolbar}
        size={size}
        dataType={dataType}
        parentKey={parentKey}
        childrenKey={childrenKey}
        hasChildrenKey={hasChildrenKey}
        treeTitleKey={treeTitleKey}
        onLoadChildren={onLoadChildren}
        expandedKeys={expandedKeysProp}
        defaultExpandedKeys={defaultExpandedKeys}
        onExpandedKeysChange={onExpandedKeysChange}
        indentSize={indentSize}
      />
    );
  }

  const tableElement = (
    <AntTable
      {...others}
      showHeader
      dataSource={tableDataSource}
      columns={antdColumns}
      rowKey={typeof rowKey === 'function' ? rowKey : record => get(record, rowKey)}
      rowSelection={antdRowSelection}
      expandable={antdExpandable}
      pagination={pagination}
      summary={typeof summary === 'function' ? (pageData, ...args) => summary(pageData, ...args) : undefined}
      sticky={antdSticky}
      tableLayout={controllerOpen || hasFixedColumn ? 'fixed' : undefined}
      scroll={tableScroll}
      onHeaderRow={() => ({
        className: 'info-page-table-header',
        style: headerStyle
      })}
      locale={{ emptyText: <div className={style['empty']}>{empty}</div> }}
      rowClassName={record => {
        const id = resolveRowKey(rowKey, record);
        const level = isTree ? treeKeyMaps?.getAncestorKeys(id)?.length || 0 : 0;
        const isChecked = useTreeCheckForRow ? getTreeCheckState(id, rowSelection?.selectedRowKeys, checkRelation, treeKeyMaps).checked : rowSelection?.selectedRowKeys && rowSelection.selectedRowKeys.indexOf(id) > -1;
        return classnames('info-page-table-row', {
          [style['is-selected-all']]: rowSelection?.isSelectedAll,
          [style['is-selected']]: isChecked,
          [style['is-disabled']]: record.disabled,
          [style['is-tree']]: isTree,
          [style['is-tree-child']]: isTree && level > 0
        });
      }}
      onRow={
        onRowSelect
          ? record => ({
              onClick: () => {
                if (record.disabled) {
                  return;
                }
                onRowSelect(record, { columns: visibleColumns, dataSource });
              }
            })
          : undefined
      }
    />
  );

  const wrappedTable = (
    <div
      ref={tableRef}
      className={classnames(style['table'], 'info-page-table', sizeClassName, className, {
        [style['is-resize']]: currentMoveColumnIndex !== null,
        [style['is-computed']]: isLayout,
        [style['has-group-header']]: hasGroupHeader,
        [style['has-summary']]: typeof summary === 'function',
        [style['is-sticky']]: !!sticky,
        [style['is-sticky-scroll-y']]: !!sticky && hasScrollY,
        [style['is-sticky-viewport']]: isStickyViewport,
        [style['is-tree-table']]: isTree
      })}
      style={tableWrapperStyle}
    >
      <div className="info-page-table-body">{!isLayout && tableElement}</div>
      {currentMoveColumnIndex !== null && resizeGuideStyle && <span className={style['column-resize-guide']} style={resizeGuideStyle} aria-hidden />}
    </div>
  );

  if (typeof render === 'function') {
    return render({
      ...others,
      header: null,
      renderBody: () => wrappedTable
    });
  }

  return wrappedTable;
};

Table.useSelectedRow = useSelectedRow;
Table.useSort = useSort;
Table.sortDataSource = useSort.sortDataSource;

export default Table;
