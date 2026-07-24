import { withFetch } from '@kne/react-fetch';
import { Pagination, Segmented } from 'antd';
import { AppstoreOutlined, TableOutlined } from '@ant-design/icons';
import { getFilterValue } from '@kne/react-filter';
import ScrollLoader from '@kne/scroll-loader';
import Table from '../Table';
import TableView from '../TableView';
import { isRenderMobileActive, globalParams } from '@kne/table-view';
import classnames from 'classnames';
import get from 'lodash/get';
import useRefCallback from '@kne/use-ref-callback';
import useControlValue from '@kne/use-control-value';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from '@kne/react-intl';
import { useIsMobile } from '@kne/responsive-utils';
import style from './style.module.scss';
import withLocale from '../withLocale';
import HorizontalScroller from './HorizontalScroller';
import '@kne/button-group/dist/index.css';
import TableToolbar, { TablePageTabs, BatchActions, hasButtonGroupList } from './TableToolbar';
import { scrollAnchorIntoView, normalizeScrollTopInsetCSSValue, resolveScrollTopInset } from './scrollUtils';

const defaultMergeList = (data, newData) => {
  return Object.assign({}, newData, {
    pageData: [...(data?.pageData || []), ...(newData?.pageData || [])]
  });
};

/** 与 use-control-value 一致：有 value key 为受控，否则用 defaultValue */
const resolveInitialFilterValue = filter => {
  if (!filter) {
    return [];
  }
  if ('value' in filter) {
    return filter.value || [];
  }
  return filter.defaultValue || [];
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

// renderCard 与 renderMobile 一致：支持 true / function / preset 字符串（从 preset({ renderCard }) 按名称取）
const resolveRenderCard = renderCard => {
  if (renderCard === true || typeof renderCard === 'function') {
    return renderCard;
  }
  if (typeof renderCard === 'string') {
    const name = renderCard.trim();
    const renderFn = name ? globalParams.renderCard?.[name] : null;
    return typeof renderFn === 'function' ? renderFn : null;
  }
  return null;
};

const readCardMode = key => {
  try {
    return localStorage.getItem(key) === 'card';
  } catch {
    return false;
  }
};

const writeCardMode = (key, isCard) => {
  try {
    localStorage.setItem(key, isCard ? 'card' : 'table');
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
    renderCard,
    forceCard = false,
    mobileSortToolbar,
    ...props
  }) => {
    const { formatMessage } = useIntl();
    const isMobile = useIsMobile();
    const isMobileRenderActive = isRenderMobileActive(renderMobile, isMobile);
    const showButtonGroup = hasButtonGroupList(buttonGroup);
    // renderCard 仅 PC 端生效；默认可切换，forceCard 强制卡片且隐藏切换按钮
    const resolvedRenderCard = useMemo(() => resolveRenderCard(renderCard), [renderCard]);
    const renderCardEnabled = resolvedRenderCard != null && !isMobile;
    // 未传 name 时不持久化切换状态
    const cardModeKey = props.name ? `${props.name.toUpperCase()}_TABLE_PAGE_CARD_MODE` : null;
    const [cardMode, setCardMode] = useState(() => (cardModeKey ? readCardMode(cardModeKey) : false));
    const isCardModeActive = renderCardEnabled && (forceCard || cardMode);
    const showCardModeToggle = renderCardEnabled && !forceCard;
    const tableContentRef = useRef(null);
    const pendingScrollRef = useRef(false);
    const handlerDataFormat = useRefCallback(dataFormat);
    const [filterValue, setFilterValue] = useControlValue(Object.assign({ defaultValue: [] }, filter));
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
    const hasInnerToolbar = !!(filter?.list?.length || (search && search.name) || (batchActions && batchActions.length) || showButtonGroup || showCardModeToggle);
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
      setFilterValue(value);
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
    // PC 卡片模式默认下拉加载，pagination.forcePagination 为 true 时仍用分页
    const useCardLoadMore = isCardModeActive && pagination.open && !pagination.forcePagination;
    const useLoadMoreMode = useMobileLoadMore || useCardLoadMore;

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
      if (useLoadMoreMode || !pagination.open || !(formatData.total > 0)) {
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
    }, [pagination, formatData.total, requestParams, formatMessage, handlePaginationChange, isMobileRenderActive, useLoadMoreMode]);

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

    // 移动端卡片模式下批量操作渲染在「全选/排序」行的排序后面
    const showMobileBatchInCardToolbar = isMobileRenderActive && Array.isArray(batchActions) && batchActions.length > 0;
    const resolvedMobileSortToolbar = showMobileBatchInCardToolbar
      ? args => (
          <>
            {typeof mobileSortToolbar === 'function' ? mobileSortToolbar(args) : null}
            <BatchActions batchActions={batchActions} rowSelection={rowSelection} selectedRows={selectedRows} batchContext={batchContext} />
          </>
        )
      : mobileSortToolbar;

    const tableProps = {
      ...props,
      renderMobile,
      mobileSortToolbar: resolvedMobileSortToolbar,
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

    // PC 卡片模式直接走 TableView 的卡片渲染（forceCardRender 在非移动端强制生效）
    const tableElement = isCardModeActive ? <TableView {...tableProps} className={classnames(tableProps.className, style['is-card-render'])} renderMobile={resolvedRenderCard} forceCardRender /> : <TableComponent {...tableProps} />;

    const cardModeToggleNode = showCardModeToggle ? (
      <Segmented
        className={style['card-mode-toggle']}
        size="small"
        value={cardMode ? 'card' : 'table'}
        options={[
          { value: 'table', icon: <TableOutlined />, title: formatMessage({ id: 'SwitchToTableView' }) },
          { value: 'card', icon: <AppstoreOutlined />, title: formatMessage({ id: 'SwitchToCardView' }) }
        ]}
        onChange={value => {
          const next = value === 'card';
          if (cardModeKey) {
            writeCardMode(cardModeKey, next);
          }
          setCardMode(next);
        }}
      />
    ) : null;

    const tableMain = (
      <HorizontalScroller
        ref={tableContentRef}
        enabled={horizontalScroller && renderType === 'Table' && !isCardModeActive}
        getPortalContainer={getScrollContainer}
        className={classnames(style['table-content'], 'loading-container', {
          'is-loading': !isComplete && !data
        })}
      >
        {showOuterTab ? <TablePageTabs filterValue={filterValue} onFilterChange={handleFilterChange} tab={tab} tabProps={tabProps} className={style['table-page-tabs-outer']} isMobileRender={isMobileRenderActive} /> : null}
        {wrapWithToolbar ? (
          <div
            className={classnames(style['table-with-toolbar'], {
              [style['is-mobile-render']]: isMobileRenderActive,
              [style['is-card-mode']]: isCardModeActive,
              [style['is-sticky']]: !!sticky
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
              cardModeToggle={cardModeToggleNode}
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
        {useLoadMoreMode ? (
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
    const filter = props.filter;
    if (!filter) {
      return {};
    }
    const initialValue = resolveInitialFilterValue(filter);
    const mapFilterValue = filter.mapFilterValue || getFilterValue;
    // 有 mapFilterValue 时即使 initialValue 为空也要跑（注入 namespace 等）
    if (!initialValue.length && !filter.mapFilterValue) {
      return {};
    }
    return mapFilterValue(initialValue);
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
