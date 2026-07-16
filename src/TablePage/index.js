import { withFetch } from '@kne/react-fetch';
import { Pagination } from 'antd';
import { getFilterValue } from '@kne/react-filter';
import ScrollLoader from '@kne/scroll-loader';
import Table from '../Table';
import TableView from '../TableView';
import { isRenderMobileActive } from '@kne/table-view';
import classnames from 'classnames';
import get from 'lodash/get';
import useRefCallback from '@kne/use-ref-callback';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from '@kne/react-intl';
import { useIsMobile, usePopupContainer } from '@kne/responsive-utils';
import style from './style.module.scss';
import withLocale from '../withLocale';
import HorizontalScroller from './HorizontalScroller';
import ButtonGroup, { ButtonFooter } from '@kne/button-group';
import '@kne/button-group/dist/index.css';
import TableToolbar, { TablePageTabs, hasButtonGroupList } from './TableToolbar';
import { resolveToolbarButtonGroupProps, resolveFooterButtonGroupProps } from './buttonGroupUtils';
import { scrollAnchorIntoView, normalizeScrollTopInsetCSSValue, resolveScrollTopInset } from './scrollUtils';

const defaultMergeList = (data, newData) => {
  return Object.assign({}, newData, {
    pageData: [...(data?.pageData || []), ...(newData?.pageData || [])]
  });
};

const readPageSize = key => {
  try {
    const value = localStorage.getItem(key);
    if (value == null || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  } catch {
    return null;
  }
};

const writePageSize = (key, size) => {
  try {
    localStorage.setItem(key, String(size));
  } catch {
    // ignore quota errors
  }
};

const TABLE_COMPONENTS = {
  Table,
  TableView
};

const collectFilterFieldNames = (filter, search, tab) => {
  const names = new Set();
  if (search?.name) {
    names.add(search.name);
  }
  if (tab?.name) {
    names.add(tab.name);
  }
  if (Array.isArray(filter?.list)) {
    filter.list.forEach(row => {
      if (!Array.isArray(row)) {
        return;
      }
      row.forEach(item => {
        const name = item?.props?.name;
        if (name) {
          names.add(name);
        }
      });
    });
  }
  return names;
};

const omitFilterParams = (params, filterFieldNames) => {
  const next = Object.assign({}, params);
  filterFieldNames.forEach(name => {
    delete next[name];
  });
  return next;
};

const TablePageInnerContent = withLocale(
  ({
    data,
    refresh,
    reload,
    requestParams,
    fetchProps,
    isComplete,
    loadMore,
    send,
    dataFormat = data => {
      return {
        list: data.pageData,
        total: data.totalCount,
        data
      };
    },
    className,
    columns,
    getColumns,
    pagination = {},
    columnRenderProps = {},
    summary,
    sticky,
    scrollTopInset,
    stickyOffset,
    renderType = 'Table',
    horizontalScroller = true,
    getScrollContainer,
    filter,
    search,
    tab,
    tabProps,
    batchActions,
    buttonGroup,
    selectedRows,
    rowSelection,
    renderMobile = true,
    ...props
  }) => {
    const { formatMessage } = useIntl();
    const isMobile = useIsMobile();
    const getPopupContainer = usePopupContainer();
    const isMobileRenderActive = isRenderMobileActive(renderMobile, isMobile);
    const showButtonGroup = hasButtonGroupList(buttonGroup);
    const showMobileButtonFooter = isMobile && showButtonGroup;
    const tableContentRef = useRef(null);
    const pendingScrollRef = useRef(false);
    const handlerDataFormat = useRefCallback(dataFormat);
    const isFilterControlled = filter && filter.value !== undefined;
    const [internalFilterValue, setInternalFilterValue] = useState(() => filter?.defaultValue || []);
    const filterValue = isFilterControlled ? filter.value : internalFilterValue;
    const mapFilterValue = filter?.mapFilterValue || getFilterValue;

    const getFilterParams = useRefCallback(value => {
      return mapFilterValue(value || []);
    });

    const filterFieldNames = useMemo(() => collectFilterFieldNames(filter, search, tab), [filter, search, tab]);

    const buildRequestParamsWithFilter = useRefCallback((value, extra = {}) => {
      return Object.assign({}, omitFilterParams(get(requestParams, pagination.paramsType), filterFieldNames), extra, getFilterParams(value));
    });

    const formatData = useMemo(() => {
      return handlerDataFormat(data);
    }, [data, handlerDataFormat]);

    const resolvedColumns = typeof getColumns === 'function' ? getColumns(data) : typeof columns === 'function' ? columns(data) : columns;

    const fetchContext = useMemo(
      () => ({
        data,
        fetchProps,
        requestParams,
        refresh,
        reload,
        loadMore,
        send,
        dataFormat,
        pagination
      }),
      [data, fetchProps, requestParams, refresh, reload, loadMore, send, dataFormat, pagination]
    );

    const hasTab = !!(tab?.name && Array.isArray(tab.list) && tab.list.length > 0);
    const hasInnerToolbar = !!(filter?.list?.length || (search && search.name) || (batchActions && batchActions.length) || (showButtonGroup && !isMobile));
    const showOuterTab = hasTab && !isMobile;
    const showInnerTab = hasTab && isMobile;
    const wrapWithToolbar = hasInnerToolbar || showInnerTab;
    const hasToolbar = wrapWithToolbar || showOuterTab;
    const resolvedScrollTopInset = resolveScrollTopInset(scrollTopInset, stickyOffset);
    const scrollTopInsetStyle = useMemo(() => {
      const cssValue = normalizeScrollTopInsetCSSValue(resolvedScrollTopInset);
      if (!cssValue) {
        return undefined;
      }
      return { '--scroll-top-inset': cssValue };
    }, [resolvedScrollTopInset]);

    const scrollTable = useRefCallback(() => {
      scrollAnchorIntoView(tableContentRef.current, {
        getScrollContainer,
        preferToolbar: hasToolbar
      });
    });

    const handleFilterChange = useRefCallback(value => {
      if (!isFilterControlled) {
        setInternalFilterValue(value);
      }
      filter?.onChange?.(value);
      reload({
        [pagination.paramsType]: buildRequestParamsWithFilter(value, {
          [pagination.currentName]: 1
        })
      });
    });

    useEffect(() => {
      if (!pendingScrollRef.current || !isComplete) {
        return;
      }
      pendingScrollRef.current = false;
      scrollTable();
    }, [isComplete, data, scrollTable]);

    const handlePaginationChange = useRefCallback((page, size) => {
      pendingScrollRef.current = true;
      if (typeof pagination.onChange === 'function') {
        pagination.onChange(page, size);
        return;
      }
      const nextSize = Number(size);
      const currentPage = get(requestParams, [pagination.paramsType, pagination.currentName], 1);
      const currentSize = Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 50;

      if (nextSize !== currentSize) {
        pagination.onShowSizeChange && pagination.onShowSizeChange(page, nextSize);
      }

      if (page !== currentPage || nextSize !== currentSize) {
        (pagination.requestType === 'refresh' ? refresh : reload)({
          [pagination.paramsType]: buildRequestParamsWithFilter(filterValue, {
            [pagination.currentName]: page,
            [pagination.pageSizeName]: nextSize
          })
        });
      }
    });

    const useMobileLoadMore = isMobileRenderActive && pagination.open && !pagination.forcePagination;

    const currentPage = get(requestParams, [pagination.paramsType, pagination.currentName], 1);
    const currentPageSize = Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 50;
    const loadMoreNoMore = !formatData.total || currentPage * currentPageSize >= formatData.total;

    const handleLoadMore = useRefCallback(async () => {
      const mergeList = pagination.mergeList || defaultMergeList;
      await loadMore(
        {
          [pagination.paramsType]: buildRequestParamsWithFilter(filterValue, {
            [pagination.currentName]: currentPage + 1,
            [pagination.pageSizeName]: currentPageSize
          })
        },
        mergeList
      );
    });

    const paginationConfig = useMemo(() => {
      if (useMobileLoadMore || !pagination.open || !(formatData.total > 0)) {
        return null;
      }

      const defaultShowTotal = total => (
        <>
          {formatMessage({ id: 'TotalText' })}&nbsp;
          <span className={style['total_text']}>{total}</span>
          &nbsp;
          {formatMessage({ id: 'ItemText' })}
        </>
      );

      const baseConfig = {
        total: formatData.total,
        ...(pagination.showTotal !== false
          ? {
              showTotal: typeof pagination.showTotal === 'function' ? pagination.showTotal : defaultShowTotal
            }
          : {}),
        current: get(requestParams, [pagination.paramsType, pagination.currentName], 1),
        pageSize: Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 50,
        onChange: handlePaginationChange,
        size: pagination.size,
        hideOnSinglePage: pagination.hideOnSinglePage,
        showSizeChanger: pagination.showSizeChanger,
        showQuickJumper: pagination.showQuickJumper,
        pageSizeOptions: pagination.pageSizeOptions
      };

      if (!isMobileRenderActive) {
        return baseConfig;
      }

      const mobilePagination = pagination.mobile || {};

      return {
        ...baseConfig,
        onShowSizeChange: handlePaginationChange,
        size: mobilePagination.size,
        showSizeChanger: mobilePagination.showSizeChanger !== false && pagination.showSizeChanger !== false,
        showQuickJumper: mobilePagination.showQuickJumper === true,
        showLessItems: mobilePagination.showLessItems ?? true,
        pageSizeOptions: pagination.pageSizeOptions || ['10', '20', '50', '100']
      };
    }, [pagination, formatData.total, requestParams, formatMessage, handlePaginationChange, isMobileRenderActive, useMobileLoadMore]);

    const batchContext = useMemo(
      () => ({
        data,
        fetchProps,
        requestParams,
        refresh,
        reload,
        loadMore,
        send,
        dataFormat,
        pagination
      }),
      [data, fetchProps, requestParams, refresh, reload, loadMore, send, dataFormat, pagination]
    );

    const tableContext = {
      ...columnRenderProps,
      requestParams,
      fetchProps,
      data
    };

    const tableProps = {
      ...props,
      renderMobile,
      rowSelection,
      dataSource: formatData.list,
      pagination: false,
      sticky,
      scrollTopInset: resolvedScrollTopInset,
      getStickyContainer: getScrollContainer,
      className: classnames(className, {
        [style['table-in-toolbar']]: wrapWithToolbar,
        [style['is-mobile-render']]: isMobileRenderActive
      }),
      columns: resolvedColumns,
      context: tableContext,
      columnRenderProps: tableContext,
      summary:
        typeof summary === 'function'
          ? (pageData, ...args) => {
              return summary(Object.assign({}, fetchContext, { pageData }, ...args));
            }
          : null
    };

    const TableComponent = TABLE_COMPONENTS[renderType] || Table;

    const tableElement = <TableComponent {...tableProps} />;

    const tableMain = (
      <HorizontalScroller
        ref={tableContentRef}
        enabled={horizontalScroller && renderType === 'Table'}
        getPortalContainer={getScrollContainer}
        className={classnames(style['table-content'], 'loading-container', {
          'is-loading': !isComplete && !data
        })}
      >
        {showOuterTab ? <TablePageTabs filterValue={filterValue} onFilterChange={handleFilterChange} tab={tab} tabProps={tabProps} className={style['table-page-tabs-outer']} isMobileRender={isMobileRenderActive} /> : null}
        {wrapWithToolbar ? (
          <div
            className={classnames(style['table-with-toolbar'], {
              [style['is-mobile-render']]: isMobileRenderActive
            })}
          >
            <TableToolbar
              filterValue={filterValue}
              onFilterChange={handleFilterChange}
              filter={filter}
              search={search}
              tab={tab}
              tabProps={tabProps}
              renderTab={showInnerTab}
              batchActions={batchActions}
              buttonGroup={buttonGroup}
              rowSelection={rowSelection}
              selectedRows={selectedRows}
              batchContext={batchContext}
              isMobileRender={isMobileRenderActive}
            />
            {tableElement}
          </div>
        ) : (
          tableElement
        )}
      </HorizontalScroller>
    );

    return (
      <div className={style['table-page']} style={scrollTopInsetStyle}>
        {useMobileLoadMore ? (
          <ScrollLoader
            className={style['mobile-load-more']}
            completeTips={formatData.total > 0 ? undefined : null}
            {...(pagination.loadMore || {})}
            useSimpleBar={false}
            isLoading={!isComplete}
            noMore={loadMoreNoMore}
            onLoader={handleLoadMore}
          >
            {tableMain}
          </ScrollLoader>
        ) : (
          <>
            {tableMain}
            {paginationConfig ? (
              <Pagination
                className={classnames(style['pagination'], {
                  [style['is-mobile-render']]: isMobileRenderActive
                })}
                {...paginationConfig}
              />
            ) : null}
          </>
        )}
        {showMobileButtonFooter ? (
          <ButtonFooter className={style['table-page-button-footer']} innerClassName={style['table-page-button-footer-inner']}>
            <div className={style['table-page-button-footer-group']}>
              <ButtonGroup {...resolveFooterButtonGroupProps(buttonGroup, getPopupContainer)} />
            </div>
          </ButtonFooter>
        ) : null}
      </div>
    );
  }
);

const TablePageInner = withFetch(TablePageInnerContent);

const TablePage = forwardRef(({ pagination, horizontalScroller = true, getScrollContainer, ...props }, ref) => {
  pagination = Object.assign(
    {},
    {
      showSizeChanger: true,
      showQuickJumper: true,
      hideOnSinglePage: false,
      open: true,
      paramsType: 'data',
      requestType: 'reload',
      currentName: 'currentPage',
      pageSizeName: 'perPage',
      pageSize: 50
    },
    pagination
  );
  const pageSizeKey = `${(props.name || 'common').toUpperCase()}_TABLE_PAGE_SIZE`;
  const cachePageSize = pagination.cachePageSize !== false;
  const [pageSize, setPageSize] = useState(() => (cachePageSize ? readPageSize(pageSizeKey) : null) ?? pagination.pageSize);
  const params = props[pagination.paramsType];
  const filterDefaultParams = useMemo(() => {
    if (!props.filter?.defaultValue?.length) {
      return {};
    }
    const mapFilterValue = props.filter.mapFilterValue || getFilterValue;
    return mapFilterValue(props.filter.defaultValue);
  }, [props.filter]);
  const fetchParams = useMemo(() => {
    return {
      [pagination.paramsType]: Object.assign({}, params, filterDefaultParams, {
        [pagination.pageSizeName]: pageSize
      })
    };
  }, [params, pagination.pageSizeName, pagination.paramsType, pageSize, filterDefaultParams]);
  return (
    <TablePageInner
      {...props}
      {...fetchParams}
      horizontalScroller={horizontalScroller}
      getScrollContainer={getScrollContainer}
      pagination={Object.assign({}, pagination, {
        pageSize,
        onShowSizeChange: (current, size) => {
          const nextSize = Number(size);
          if (cachePageSize) {
            writePageSize(pageSizeKey, nextSize);
          }
          setPageSize(nextSize);
        }
      })}
      ref={ref}
    />
  );
});

export default TablePage;
