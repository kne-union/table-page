import React from 'react';
import { Checkbox, Col, Row } from 'antd';
import classnames from 'classnames';
import get from 'lodash/get';
import Label from '../Label';
import { renderColumnTitle } from '../useSort';
import { formatColumnWidthPx, getColumnWidthPx, parseColumnWidth } from './columnWidth';
import style from './style.module.scss';

const Header = p => {
  const { dataSource, columns, defaultSpan, rowKey, rowSelection, colsSize, setColsSize, sticky, headerStyle, sortRender } = Object.assign(
    {},
    {
      rowKey: 'id'
    },
    p
  );
  return (
    <Row
      wrap={false}
      style={headerStyle}
      className={classnames(
        style['header'],
        {
          [style['sticky']]: sticky
        },
        'info-page-table-header'
      )}
    >
      {rowSelection && rowSelection.type === 'checkbox' && (
        <Col className={classnames(style['col'], style['col-fixed'], 'info-page-table-col')}>
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
        </Col>
      )}
      <Col flex={1}>
        <Row wrap={false}>
          {columns.map(column => {
            const { name, title, span, width } = column;
            return (
              <Col
                key={name}
                style={{
                  '--col-width': formatColumnWidthPx(getColumnWidthPx(column, colsSize)),
                  '--col-span': `${span || defaultSpan}`,
                  '--col-align': column.align || 'top',
                  '--col-justify': column.justify || 'flex-start'
                }}
                className={classnames(style['col'], 'info-page-table-col')}
              >
                <Label
                  className={style['col-content']}
                  onChange={size => {
                    setColsSize(value => Object.assign({}, value, { [name]: Math.max(size.width, parseColumnWidth(width)) }));
                  }}
                >
                  {renderColumnTitle(title, column, sortRender)}
                </Label>
              </Col>
            );
          })}
        </Row>
      </Col>
      {rowSelection && rowSelection.type !== 'checkbox' && <Col className={classnames(style['col'], style['single-checked'], 'info-page-table-col')}></Col>}
    </Row>
  );
};

export default Header;
