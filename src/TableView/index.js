import React, { useMemo, useState } from 'react';
import Header, { renderHeaderGridCells } from './Header';
import { Checkbox, Empty } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import classnames from 'classnames';
import get from 'lodash/get';
import computeColumnsValue, { computeDisplay } from '../computeColumnsValue';
import { isEmpty } from '@kne/is-empty';
import { getColumnLayout, getGridTemplateColumns, hasColumnSpan, hasColumnWidth } from './columnWidth';
import style from './style.module.scss';
import useSelectedRow from '../useSelectedRow';
import useSort from '../useSort';
import { renderCellContent } from '../renderCellContent';
import { resolveColumns } from '../columnRenderType';

const getLayoutColumns = columns => columns.filter(column => column.display !== false);

const TableView = p => {
  const [colsSize, setColsSize] = useState({});
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
  const { className, dataSource, columns: columnsProp, rowKey, rowSelection, valueIsEmpty, emptyIsPlaceholder, placeholder, empty, onRowSelect, render, context, sticky, headerStyle, sortRender, ...others } = props;
  const columns = useMemo(() => resolveColumns(columnsProp), [columnsProp]);
  const layoutColumns = useMemo(() => getLayoutColumns(columns), [columns]);
  const defaultSpan = useMemo(() => {
    const assignedSpan = layoutColumns.reduce((a, b) => a + (b.span || 0), 0);
    const undistributedColCount = layoutColumns.filter(item => !hasColumnSpan(item) && !hasColumnWidth(item, layoutColumns)).length;

    return undistributedColCount > 0 ? Math.round(Math.max(24 - assignedSpan, 0) / undistributedColCount) : 1;
  }, [layoutColumns]);

  const gridTemplateColumns = useMemo(() => getGridTemplateColumns(layoutColumns, { defaultSpan, colsSize, rowSelection }), [layoutColumns, defaultSpan, colsSize, rowSelection]);

  const headerCellProps = {
    dataSource,
    columns: layoutColumns,
    rowKey,
    rowSelection,
    colsSize,
    setColsSize,
    sortRender,
    defaultSpan
  };

  const header = <Header {...headerCellProps} headerStyle={headerStyle} />;

  const handleRowClick = (item, { dataSource, context, id, isChecked }) => {
    if (item.disabled) {
      return;
    }
    onRowSelect && onRowSelect(item, { columns: layoutColumns, dataSource });
    if (!rowSelection || rowSelection.isSelectedAll) {
      return;
    }
    if (rowSelection.type === 'checkbox') {
      const selectedRowKeys = (rowSelection.selectedRowKeys || []).slice(0);
      isChecked ? selectedRowKeys.splice(rowSelection.selectedRowKeys.indexOf(id), 1) : selectedRowKeys.push(id);
      rowSelection.onChange(selectedRowKeys, id, { context, checked: !isChecked });
      return;
    }
    const selectedRowKeys = rowSelection.selectedRowKeys.length && rowSelection.selectedRowKeys[0] === id ? [] : [id];
    rowSelection.onChange(selectedRowKeys, id, { context, checked: !isChecked });
  };

  const renderBodyGridCells = (dataSource, context) => {
    const getId = item => get(item, typeof rowKey === 'function' ? rowKey(item) : rowKey);

    if (!dataSource || dataSource.length === 0) {
      return null;
    }

    return dataSource.map(item => {
      const id = getId(item);
      const isChecked = rowSelection?.selectedRowKeys && rowSelection.selectedRowKeys.indexOf(id) > -1;
      const columnsValue = computeColumnsValue({ columns: layoutColumns, emptyIsPlaceholder, valueIsEmpty, removeEmpty: true, dataSource: item, placeholder, context });
      const columnMap = columnsValue.reduce((result, column) => Object.assign(result, { [column.name]: column }), {});
      const rowClassName = classnames(style['body'], style['body-cell'], style['body-row'], 'info-page-table-row', {
        [style['is-selected-all']]: rowSelection?.isSelectedAll,
        [style['is-selected']]: isChecked,
        [style['is-disabled']]: item.disabled
      });
      const onCellClick = () => handleRowClick(item, { dataSource, context, id, isChecked });
      const cells = [];

      if (rowSelection?.type === 'checkbox') {
        cells.push(
          <div key={`${id}__selection__`} className={classnames(style['col'], style['col-fixed'], 'info-page-table-col')} onClick={onCellClick}>
            <span className={classnames(style['col-content'], 'info-page-table-col-content')}>
              <Checkbox disabled={item.disabled || rowSelection.isSelectedAll} checked={(rowSelection.isSelectedAll && !item.disabled) || isChecked} />
            </span>
          </div>
        );
      }

      layoutColumns.forEach((column, index) => {
        const columnValue = columnMap[column.name];
        const {
          widthBased,
          fillRemaining,
          style: columnStyle
        } = getColumnLayout(column, {
          defaultSpan,
          colsSize,
          isLastColumn: index === layoutColumns.length - 1,
          columns: layoutColumns
        });

        cells.push(
          <div key={`${id}-${column.name}`} style={columnStyle} className={classnames(style['col'], fillRemaining ? style['col-width-fill'] : widthBased && style['col-width-based'], 'info-page-table-col')} onClick={onCellClick}>
            {columnValue ? renderCellContent(computeDisplay({ column: columnValue, placeholder, dataSource: item, context }), columnValue, style['col-content']) : <span className={style['col-content']} />}
          </div>
        );
      });

      if (rowSelection?.type === 'radio') {
        cells.push(
          <div key={`${id}__radio__`} className={classnames(style['col'], style['single-checked'], 'info-page-table-col')} onClick={onCellClick}>
            {isChecked && <CheckOutlined />}
          </div>
        );
      }

      return (
        <div key={id} className={rowClassName}>
          {cells}
        </div>
      );
    });
  };

  const renderGrid = (dataSource, context) => (
    <div className={style['grid']} style={{ gridTemplateColumns }}>
      {renderHeaderGridCells(headerCellProps)}
      {renderBodyGridCells(dataSource, context)}
    </div>
  );

  const renderBody = (dataSource, context) => {
    if (!dataSource || dataSource.length === 0) {
      return <div className={style['empty']}>{empty}</div>;
    }

    return <div className={classnames('info-page-table-body')}>{renderGrid(dataSource, context)}</div>;
  };

  if (typeof render === 'function') {
    return render({ ...others, header, renderBody });
  }

  return (
    <div {...others} className={classnames(style['table'], style['tableView'], 'info-page-table', className)}>
      {dataSource && dataSource.length > 0 ? (
        renderGrid(dataSource, context)
      ) : (
        <>
          <div className={style['grid']} style={{ gridTemplateColumns }}>
            {renderHeaderGridCells(headerCellProps)}
          </div>
          <div className={style['empty']}>{empty}</div>
        </>
      )}
    </div>
  );
};

TableView.Header = Header;
TableView.useSelectedRow = useSelectedRow;
TableView.useSort = useSort;
TableView.sortDataSource = useSort.sortDataSource;
export default TableView;
