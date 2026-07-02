import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Empty, Table as AntTable } from 'antd';
import classnames from 'classnames';
import get from 'lodash/get';
import computeColumnsValue, { computeDisplay } from '../computeColumnsValue';
import { isEmpty } from '@kne/is-empty';
import { parseColumnWidth } from '../TableView/columnWidth';
import viewStyle from '../TableView/style.module.scss';
import style from './style.module.scss';
import useSelectedRow from '../useSelectedRow';
import useSort, { renderColumnTitle } from '../useSort';
import { wrapColumnHeaderTitle } from '../columnHeaderTitle';
import useTableConfig from '../useTableConfig';
import useGroupHeader from '../useGroupHeader';
import useElementWidth from '../useElementWidth';
import { getColumnEllipsis, renderCellContent } from '../renderCellContent';
import { resolveColumns } from '../columnRenderType';
import { normalizeScrollTopInsetCSSValue, parseInsetPixels, resolveScrollTopInset } from '../TablePage/scrollUtils';

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

const wrapColContent = node => <span className={viewStyle['col-content']}>{node}</span>;

const Table = p => {
  const tableRef = useRef(null);
  const tableWidth = useElementWidth(tableRef);
  const [isLayout, setIsLayout] = useState(true);

  const props = Object.assign(
    {},
    {
      rowKey: 'id',
      valueIsEmpty: isEmpty,
      placeholder: '-',
      emptyIsPlaceholder: true,
      empty: <Empty />,
      controllerOpen: true
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
    context,
    sticky,
    scrollTopInset,
    stickyOffset,
    getStickyContainer,
    headerStyle,
    pagination = false,
    sortRender,
    name,
    controllerOpen,
    tableServerApis,
    scroll,
    summary,
    ...others
  } = props;

  const columns = useMemo(() => resolveColumns(columnsProp), [columnsProp]);

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
        title: <span className={viewStyle['col-content']}>{renderColumnTitle(title, column, sortRender)}</span>,
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
          return renderCellContent(computeDisplay({ column: computedColumn, placeholder, dataSource: record, context }), computedColumn, viewStyle['col-content']);
        }
      };

      if (!controllerOpen) {
        return baseColumn;
      }

      const configProps = computedColumnProps(column, index, {
        title: <span className={viewStyle['col-content']}>{renderColumnTitle(title, column, sortRender)}</span>
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
          title: <span className={viewStyle['col-content']}>{wrapColumnHeaderTitle(column.title)}</span>,
          onHeaderCell: () => ({
            className: getAntCellClassName(),
            style: { textAlign: 'center', verticalAlign: 'middle' }
          }),
          children: column.children.map(mapColumn)
        };
      }
      return buildLeafColumn(column, column.__index);
    };

    return groupedColumns.map(mapColumn);
  }, [groupedColumns, context, emptyIsPlaceholder, placeholder, sortRender, valueIsEmpty, controllerOpen, computedColumnProps, currentMoveColumnIndex]);

  const antdRowSelection = useMemo(() => {
    if (!rowSelection) {
      return undefined;
    }

    const getRowKey = record => resolveRowKey(rowKey, record);

    return {
      type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
      ...(hasFixedColumn ? { fixed: 'left' } : {}),
      selectedRowKeys: rowSelection.isSelectedAll ? (dataSource || []).filter(item => !item.disabled).map(getRowKey) : rowSelection.selectedRowKeys,
      onChange: (selectedRowKeys, selectedRows, info) => {
        if (info.type === 'all') {
          const checked = selectedRowKeys.length > 0;
          if (typeof rowSelection.onIsSelectAllChange === 'function') {
            rowSelection.onIsSelectAllChange(checked);
            return;
          }
          if (!checked) {
            rowSelection.onChange([], undefined, { context, checked: false });
            return;
          }
          rowSelection.onChange((dataSource || []).map(getRowKey), undefined, { context, checked: true });
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
  }, [context, dataSource, rowKey, rowSelection, hasFixedColumn]);

  const tableScroll = useMemo(() => {
    let x;
    if (hasFixedColumn) {
      x = totalWidth;
    } else if (controllerOpen) {
      x = Math.max(tableWidth, totalWidth);
    }
    return Object.assign({}, x != null ? { x } : {}, scroll);
  }, [hasFixedColumn, controllerOpen, totalWidth, tableWidth, scroll]);

  const hasScrollY = scroll?.y != null && scroll?.y !== false;
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
    const cssValue = normalizeScrollTopInsetCSSValue(resolvedScrollTopInset);
    if (!cssValue) {
      return undefined;
    }
    return { '--scroll-top-inset': cssValue };
  }, [resolvedScrollTopInset]);

  const tableElement = (
    <AntTable
      {...others}
      showHeader
      dataSource={dataSource}
      columns={antdColumns}
      rowKey={typeof rowKey === 'function' ? rowKey : record => get(record, rowKey)}
      rowSelection={antdRowSelection}
      pagination={pagination}
      summary={typeof summary === 'function' ? (pageData, ...args) => summary(pageData, ...args) : undefined}
      sticky={antdSticky}
      tableLayout={controllerOpen || hasFixedColumn ? 'fixed' : undefined}
      scroll={tableScroll}
      onHeaderRow={() => ({
        className: classnames(viewStyle['header'], 'info-page-table-header'),
        style: headerStyle
      })}
      locale={{ emptyText: <div className={viewStyle['empty']}>{empty}</div> }}
      rowClassName={record => {
        const id = resolveRowKey(rowKey, record);
        const isChecked = rowSelection?.selectedRowKeys && rowSelection.selectedRowKeys.indexOf(id) > -1;
        return classnames(viewStyle['body'], 'info-page-table-row', {
          [viewStyle['is-selected-all']]: rowSelection?.isSelectedAll,
          [viewStyle['is-selected']]: isChecked,
          [viewStyle['is-disabled']]: record.disabled
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
      className={classnames(style['table'], 'info-page-table', className, {
        [style['is-resize']]: currentMoveColumnIndex !== null,
        [style['is-computed']]: isLayout,
        [style['has-group-header']]: hasGroupHeader,
        [style['has-summary']]: typeof summary === 'function',
        [style['is-sticky']]: !!sticky,
        [style['is-sticky-scroll-y']]: !!sticky && hasScrollY,
        [style['is-sticky-viewport']]: isStickyViewport
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
