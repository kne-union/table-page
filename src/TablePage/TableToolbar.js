import React, { useMemo } from 'react';
import { Button, Dropdown, Tabs } from 'antd';
import { DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { FilterOuter, FilterLines, FilterValueDisplay, SearchInput } from '@kne/react-filter';
import '@kne/react-filter/dist/index.css';
import classnames from 'classnames';
import { useIntl } from '@kne/react-intl';
import { useIsMobile, usePopupContainer } from '@kne/responsive-utils';
import style from './tableToolbar.module.scss';

const TAB_ALL_KEY = '__all__';

const getTabActiveKey = (filterValue, tabName) => {
  if (!tabName || !Array.isArray(filterValue)) {
    return TAB_ALL_KEY;
  }
  const entry = filterValue.find(item => item?.name === tabName);
  const value = entry?.value?.value;
  return value == null || value === '' ? TAB_ALL_KEY : String(value);
};

export const TablePageTabs = ({ filterValue, onFilterChange, tab, tabProps, className, isMobileRender }) => {
  const { formatMessage } = useIntl();
  const showTab = !!(tab?.name && Array.isArray(tab.list) && tab.list.length > 0);

  const tabItems = useMemo(() => {
    if (!showTab) {
      return [];
    }
    return [
      { key: TAB_ALL_KEY, label: formatMessage({ id: 'All' }) },
      ...tab.list.map(item => ({
        key: String(item.value),
        label: item.label
      }))
    ];
  }, [showTab, tab?.list, formatMessage]);

  if (!showTab) {
    return null;
  }

  const handleTabChange = key => {
    const next = (Array.isArray(filterValue) ? filterValue : []).filter(item => item?.name !== tab.name);
    if (key !== TAB_ALL_KEY) {
      const option = tab.list.find(item => String(item.value) === key);
      if (option) {
        next.push({
          name: tab.name,
          label: tab.label,
          value: { value: option.value, label: option.label }
        });
      }
    }
    onFilterChange(next);
  };

  return (
    <div
      className={classnames(style['table-page-tabs'], className, {
        [style['is-mobile-render']]: isMobileRender
      })}
    >
      <Tabs size="small" {...tabProps} activeKey={getTabActiveKey(filterValue, tab.name)} onChange={handleTabChange} items={tabItems} />
    </div>
  );
};

const TableToolbar = ({ filterValue, onFilterChange, filter, search, tab, tabProps, renderTab = true, batchActions, rowSelection, selectedRows, batchContext, isMobileRender }) => {
  const { formatMessage } = useIntl();
  const isMobile = useIsMobile();
  const getPopupContainer = usePopupContainer();
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
  const hasTab = !!(tab?.name && Array.isArray(tab.list) && tab.list.length > 0);
  const showTab = hasTab && renderTab;
  const batchButtonLabel = hasSelection
    ? isMobile
      ? formatMessage({ id: 'BatchOperationsMobileSelected' }, { count: selectedRowKeys.length })
      : formatMessage({ id: 'BatchOperationsWithCount' }, { count: selectedRowKeys.length })
    : formatMessage({ id: 'BatchOperations' });

  if (!showBatch && !showFilter && !showSearch && !showTab) {
    return null;
  }

  const { list: filterList, displayLine = 1, extraExpand, className: filterClassName, ...filterRest } = filter || {};
  const { className: searchClassName, style: searchStyle, ...searchRest } = search || {};

  const hasValueDisplay = filterValue?.length > 0;
  const showMobileSearchRow = isMobile && showSearch;
  const showMainToolbar = showBatch || showFilter || (!isMobile && showSearch);

  const searchInputNode = showSearch ? (
    <SearchInput
      allowClear
      bordered={false}
      variant="filled"
      size={isMobile ? 'middle' : 'small'}
      className={classnames(style['table-toolbar-search-input'], searchClassName)}
      style={isMobile ? { ...searchStyle, width: '100%', maxWidth: '100%' } : searchStyle}
      {...searchRest}
    />
  ) : null;

  return (
    <FilterOuter value={filterValue} onChange={onFilterChange} className={style['table-toolbar-filter-outer']}>
      {() => (
        <div
          className={classnames(style['table-toolbar-section'], 'table-page-toolbar-section', {
            [style['has-value-display']]: hasValueDisplay,
            [style['has-mobile-search']]: showMobileSearchRow,
            [style['has-mobile-search-only']]: showMobileSearchRow && !showMainToolbar && !showTab,
            [style['has-tabs']]: showTab,
            [style['is-mobile-render']]: isMobileRender,
            'table-page-toolbar-section--has-value': hasValueDisplay
          })}
        >
          {showMobileSearchRow ? <div className={classnames(style['table-toolbar-search-row'], style['table-toolbar-search'])}>{searchInputNode}</div> : null}
          {showTab ? <TablePageTabs filterValue={filterValue} onFilterChange={onFilterChange} tab={tab} tabProps={tabProps} isMobileRender={isMobileRender} /> : null}
          {showMainToolbar ? (
            <div
              className={classnames(style['table-toolbar'], 'table-page-toolbar', {
                [style['is-mobile']]: isMobile
              })}
            >
              {showBatch ? (
                <>
                  <div className={style['table-toolbar-batch']}>
                    <Dropdown disabled={!hasSelection} menu={{ items: batchMenuItems }} trigger={['click']} getPopupContainer={getPopupContainer}>
                      <Button size="small" disabled={!hasSelection} className={style['table-toolbar-batch-btn']}>
                        {batchButtonLabel}
                        <DownOutlined />
                      </Button>
                    </Dropdown>
                    {hasSelection ? (
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        title={formatMessage({ id: 'Cancel' })}
                        aria-label={formatMessage({ id: 'Cancel' })}
                        className={style['table-toolbar-batch-clear-btn']}
                        onClick={() => {
                          rowSelection?.onChange?.([]);
                          rowSelection?.onIsSelectAllChange?.(false);
                        }}
                      />
                    ) : null}
                  </div>
                  {showFilter && <span className={style['table-toolbar-divider']} aria-hidden />}
                </>
              ) : null}
              {showFilter ? (
                <div className={style['table-toolbar-filter']}>
                  <div className={classnames(style['table-toolbar-filter-inner'], filterClassName)}>
                    <FilterLines list={filterList} displayLine={displayLine} label="" {...filterRest} />
                  </div>
                </div>
              ) : null}
              {!showMobileSearchRow && showSearch ? (
                <>
                  {showFilter && <span className={style['table-toolbar-divider']} aria-hidden />}
                  <div className={style['table-toolbar-search']}>{searchInputNode}</div>
                </>
              ) : null}
            </div>
          ) : null}
          {hasValueDisplay ? (
            <div
              className={classnames(style['table-toolbar-value-display'], {
                [style['is-mobile-render']]: isMobileRender
              })}
            >
              <FilterValueDisplay value={filterValue} onChange={onFilterChange} extraExpand={extraExpand} flush={isMobileRender} />
            </div>
          ) : null}
        </div>
      )}
    </FilterOuter>
  );
};

export default TableToolbar;
