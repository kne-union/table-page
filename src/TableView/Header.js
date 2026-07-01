import React from 'react';
import { Checkbox } from 'antd';
import classnames from 'classnames';
import get from 'lodash/get';
import Label from '../Label';
import { renderColumnTitle } from '../useSort';
import { getColumnLayout, parseColumnWidth } from './columnWidth';
import { resolveColumnDimensions } from '../columnRenderType';
import style from './style.module.scss';

const renderHeaderCellContent = (column, { sortRender, widthBased, setColsSize, defaultSpan, colsSize }) => {
  const titleNode = renderColumnTitle(column.title, column, sortRender);
  const contentClassName = style['col-content'];

  if (widthBased) {
    return <span className={contentClassName}>{titleNode}</span>;
  }

  return (
    <Label
      className={contentClassName}
      onChange={size => {
        setColsSize(value =>
          Object.assign({}, value, {
            [column.name]: Math.max(size.width, parseColumnWidth(resolveColumnDimensions(column).width))
          })
        );
      }}
    >
      {titleNode}
    </Label>
  );
};

export const renderHeaderGridCells = ({ dataSource, columns, rowKey, rowSelection, colsSize, setColsSize, sticky, sortRender, defaultSpan }) => {
  const cells = [];

  if (rowSelection?.type === 'checkbox') {
    cells.push(
      <div key="__selection__" className={classnames(style['col'], style['col-fixed'], style['header-cell'], sticky && style['sticky'], 'info-page-table-col')}>
        <span className={classnames(style['col-content'], 'info-page-table-col-content')}>
          {rowSelection.allowSelectedAll ? (
            (() => {
              const checkedAll =
                rowSelection.isSelectedAll || (dataSource && dataSource.every(item => rowSelection.selectedRowKeys && rowSelection.selectedRowKeys.indexOf(get(item, typeof rowKey === 'function' ? rowKey(item) : rowKey)) > -1));
              return (
                <Checkbox
                  checked={checkedAll}
                  indeterminate={rowSelection.selectedRowKeys && rowSelection.selectedRowKeys.length > 0 && !checkedAll}
                  onChange={e => {
                    const checked = e.target.checked;
                    if (!checked) {
                      typeof rowSelection.onIsSelectAllChange === 'function' ? rowSelection.onIsSelectAllChange(false) : rowSelection.onChange([]);
                    } else {
                      typeof rowSelection.onIsSelectAllChange === 'function'
                        ? rowSelection.onIsSelectAllChange(true)
                        : dataSource &&
                          dataSource.length > 0 &&
                          rowSelection.onChange(
                            dataSource.map(item => {
                              return get(item, typeof rowKey === 'function' ? rowKey(item) : rowKey);
                            })
                          );
                    }
                  }}
                />
              );
            })()
          ) : (
            <Checkbox style={{ visibility: 'hidden' }} />
          )}
        </span>
      </div>
    );
  }

  columns.forEach(column => {
    const { widthBased, style: columnStyle } = getColumnLayout(column, { defaultSpan, colsSize });
    cells.push(
      <div key={column.name} style={columnStyle} className={classnames(style['col'], widthBased && style['col-width-based'], style['header-cell'], sticky && style['sticky'], 'info-page-table-col')}>
        {renderHeaderCellContent(column, { sortRender, widthBased, setColsSize, defaultSpan, colsSize })}
      </div>
    );
  });

  if (rowSelection?.type === 'radio') {
    cells.push(<div key="__radio__" className={classnames(style['col'], style['single-checked'], style['header-cell'], sticky && style['sticky'], 'info-page-table-col')} />);
  }

  return cells;
};

const Header = p => {
  const { dataSource, columns, rowKey, rowSelection, colsSize, setColsSize, sticky, headerStyle, sortRender, defaultSpan } = Object.assign(
    {},
    {
      rowKey: 'id'
    },
    p
  );

  return (
    <div style={headerStyle} className={classnames(style['header'], 'info-page-table-header')}>
      {renderHeaderGridCells({ dataSource, columns, rowKey, rowSelection, colsSize, setColsSize, sticky, sortRender, defaultSpan })}
    </div>
  );
};

export default Header;
