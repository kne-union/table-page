import React, { useMemo } from 'react';
import { Button, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { FilterProvider, FilterLines, FilterValueDisplay, SearchInput } from '@kne/react-filter';
import '@kne/react-filter/dist/index.css';
import classnames from 'classnames';
import { useIntl } from '@kne/react-intl';
import style from './tableToolbar.module.scss';

const TableToolbar = ({ filterValue, onFilterChange, filter, search, batchActions, rowSelection, selectedRows, batchContext }) => {
  const { formatMessage } = useIntl();
  const selectedRowKeys = rowSelection?.selectedRowKeys || [];
  const hasSelection = selectedRowKeys.length > 0;

  const batchMenuItems = useMemo(() => {
    if (!Array.isArray(batchActions) || batchActions.length === 0) {
      return [];
    }
    return batchActions.map(item => {
      const { key, label, disabled, danger, onClick } = item;
      const isDisabled = disabled ?? !hasSelection;
      return {
        key: key || label,
        label,
        danger,
        disabled: isDisabled,
        onClick: () => {
          if (isDisabled) {
            return;
          }
          onClick?.({
            selectedRowKeys,
            selectedRows: selectedRows || [],
            rowSelection,
            ...batchContext
          });
        }
      };
    });
  }, [batchActions, batchContext, hasSelection, rowSelection, selectedRowKeys, selectedRows]);

  const showBatch = batchMenuItems.length > 0;
  const showFilter = filter?.list?.length > 0;
  const showSearch = search && search.name;

  if (!showBatch && !showFilter && !showSearch) {
    return null;
  }

  const { list: filterList, displayLine = 1, extraExpand, className: filterClassName, ...filterRest } = filter || {};
  const { className: searchClassName, style: searchStyle, ...searchRest } = search || {};

  const hasValueDisplay = filterValue?.length > 0;

  return (
    <FilterProvider value={filterValue} onChange={onFilterChange}>
      <div
        className={classnames(style['table-toolbar-section'], 'table-page-toolbar-section', {
          [style['has-value-display']]: hasValueDisplay,
          'table-page-toolbar-section--has-value': hasValueDisplay
        })}
      >
        <div className={classnames(style['table-toolbar'], 'table-page-toolbar')}>
          {showBatch ? (
            <>
              <div className={style['table-toolbar-batch']}>
                <Dropdown disabled={!hasSelection} menu={{ items: batchMenuItems }} trigger={['click']}>
                  <Button size="small" disabled={!hasSelection} className={style['table-toolbar-batch-btn']}>
                    {hasSelection ? formatMessage({ id: 'BatchOperationsWithCount' }, { count: selectedRowKeys.length }) : formatMessage({ id: 'BatchOperations' })}
                    <DownOutlined />
                  </Button>
                </Dropdown>
              </div>
              {(showFilter || showSearch) && <span className={style['table-toolbar-divider']} aria-hidden />}
            </>
          ) : null}
          {showFilter ? (
            <div className={style['table-toolbar-filter']}>
              <div className={classnames(style['table-toolbar-filter-inner'], filterClassName)}>
                <FilterLines list={filterList} displayLine={displayLine} label="" {...filterRest} />
              </div>
            </div>
          ) : null}
          {showSearch ? (
            <>
              {showFilter && <span className={style['table-toolbar-divider']} aria-hidden />}
              <div className={style['table-toolbar-search']}>
                <SearchInput allowClear bordered={false} variant="filled" size="small" className={classnames(style['table-toolbar-search-input'], searchClassName)} style={searchStyle} {...searchRest} />
              </div>
            </>
          ) : null}
        </div>
        {hasValueDisplay ? (
          <div className={style['table-toolbar-value-display']}>
            <FilterValueDisplay value={filterValue} onChange={onFilterChange} extraExpand={extraExpand} />
          </div>
        ) : null}
      </div>
    </FilterProvider>
  );
};

export default TableToolbar;
