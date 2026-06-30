import React, { useMemo } from 'react';
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
import { getColumnEllipsis, renderCellContent } from '../renderCellContent';

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

const getColCellStyle = column => ({
  textAlign: mapJustifyToAlign(column.justify),
  verticalAlign: column.align === 'middle' ? 'middle' : column.align === 'bottom' ? 'bottom' : 'top'
});

const wrapColContent = node => <span className={viewStyle['col-content']}>{node}</span>;

const Table = p => {
  const props = Object.assign(
    {},
    {
      rowKey: 'id',
      valueIsEmpty: isEmpty,
      placeholder: '-',
      emptyIsPlaceholder: true,
      empty: <Empty />
    },
    p
  );
  const { className, dataSource, columns, rowKey, rowSelection, valueIsEmpty, emptyIsPlaceholder, placeholder, empty, onRowSelect, render, context, sticky, headerStyle, pagination = false, sortRender, ...others } = props;

  const antdColumns = useMemo(() => {
    return columns.map(column => {
      const { name, title, width, align, justify } = column;
      return {
        key: name,
        dataIndex: name,
        title: <span className={viewStyle['col-content']}>{renderColumnTitle(title, column, sortRender)}</span>,
        width: toAntdWidth(width),
        align: mapJustifyToAlign(justify),
        ellipsis: getColumnEllipsis(column),
        onHeaderCell: () => ({
          className: classnames(viewStyle['col'], 'info-page-table-col'),
          style: getColCellStyle(column)
        }),
        onCell: () => ({
          className: classnames(viewStyle['col'], 'info-page-table-col'),
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
    });
  }, [columns, context, emptyIsPlaceholder, placeholder, sortRender, valueIsEmpty]);

  const antdRowSelection = useMemo(() => {
    if (!rowSelection) {
      return undefined;
    }

    const getRowKey = record => resolveRowKey(rowKey, record);

    return {
      type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
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
              className: classnames(viewStyle['col'], style['selection-col'], 'info-page-table-col')
            })
          }
        : {
            columnWidth: 30,
            renderCell: (checked, record, index, originNode) => wrapColContent(originNode),
            onCell: () => ({
              className: classnames(viewStyle['col'], style['radio-col'], 'info-page-table-col')
            })
          })
    };
  }, [context, dataSource, rowKey, rowSelection]);

  const tableElement = (
    <AntTable
      {...others}
      showHeader
      dataSource={dataSource}
      columns={antdColumns}
      rowKey={typeof rowKey === 'function' ? rowKey : record => get(record, rowKey)}
      rowSelection={antdRowSelection}
      pagination={pagination}
      sticky={sticky ? { offsetHeader: 0 } : undefined}
      onHeaderRow={() => ({
        className: classnames(viewStyle['header'], 'info-page-table-header', {
          [viewStyle['sticky']]: sticky
        }),
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
      onRow={record => ({
        onClick: e => {
          if (e.target.closest('.ant-table-selection-column')) {
            return;
          }
          if (record.disabled) {
            return;
          }
          onRowSelect && onRowSelect(record, { columns, dataSource });
          if (!rowSelection || rowSelection.isSelectedAll) {
            return;
          }
          const id = resolveRowKey(rowKey, record);
          const isChecked = rowSelection.selectedRowKeys && rowSelection.selectedRowKeys.indexOf(id) > -1;
          if (rowSelection.type === 'checkbox') {
            const selectedRowKeys = (rowSelection.selectedRowKeys || []).slice(0);
            isChecked ? selectedRowKeys.splice(rowSelection.selectedRowKeys.indexOf(id), 1) : selectedRowKeys.push(id);
            rowSelection.onChange(selectedRowKeys, id, { context, checked: !isChecked });
            return;
          }
          const selectedRowKeys = rowSelection.selectedRowKeys?.length && rowSelection.selectedRowKeys[0] === id ? [] : [id];
          rowSelection.onChange(selectedRowKeys, id, { context, checked: !isChecked });
        }
      })}
    />
  );

  const wrappedTable = (
    <div className={classnames(viewStyle['table'], style['table'], 'info-page-table', className)}>
      <div className="info-page-table-body">{tableElement}</div>
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
