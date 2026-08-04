import { withFetch } from '@kne/react-fetch';
import { Pagination, Segmented, Skeleton, Spin } from 'antd';
import { AppstoreOutlined, TableOutlined } from '@ant-design/icons';
import { getFilterValue } from '@kne/react-filter';
import ScrollLoader from '@kne/scroll-loader';
import Table from '../Table';
import TableView from '../TableView';
import { isRenderMobileActive, globalParams, resolveColumns } from '@kne/table-view';
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
import { parseSearchParamsValue, mergeFilterByName, stripConsumedUrlParams, parsePaginationSearchParams, patchPaginationSearchParams, isPaginationSearchParamsEnabled } from './searchParamsValue';

const noop = () => {};

const SKELETON_ROW_COUNT = 8;
const FALLBACK_SKELETON_COLUMNS = 5;

/** 是否存在工具栏 / Filter 区域（首屏 loading 需占位保高） */
const hasToolbarArea = ({ filter, search, tab, batchActions, buttonGroup, renderCard, forceCard }, isMobile) => {
  const hasTab = !!(tab?.name && Array.isArray(tab.list) && tab.list.length > 0);
  const hasFilter = !!(filter?.list?.length > 0);
  const hasSearch = !!(search && search.name);
  const hasBatch = Array.isArray(batchActions) && batchActions.length > 0;
  const hasBtn = hasButtonGroupList(buttonGroup);
  const hasCardToggle = !isMobile && resolveRenderCard(renderCard) != null && !forceCard;
  return hasTab || hasFilter || hasSearch || hasBatch || hasBtn || hasCardToggle;
};

const flattenLeafColumns = (columns, output = []) => {
  (columns || []).forEach(column => {
    if (Array.isArray(column?.children) && column.children.length > 0) {
      flattenLeafColumns(column.children, output);
      return;
    }
    output.push(column);
  });
  return output;
};

/** 首包无 data 时尽量解析列配置；失败则用占位列 */
const resolveLoadingColumns = (columns, getColumns) => {
  try {
    const raw = typeof getColumns === 'function' ? getColumns(null) : typeof columns === 'function' ? columns(null) : columns;
    if (!Array.isArray(raw) || raw.length === 0) {
      return null;
    }
    return flattenLeafColumns(resolveColumns(raw));
  } catch (e) {
    return null;
  }
};

const CellSkeleton = () => <Skeleton.Button active size="small" className={style['table-cell-skeleton']} style={{ width: '70%' }} />;

/**
 * 产出 Table / TableView 共用列：
 * - 用 render 画骨架（不用 placeholder）
 * - valueIsEmpty 恒 false，避免 TableView removeEmpty 把空列滤掉导致格子空白
 */
const buildSkeletonTableColumns = leafColumns => {
  const source =
    leafColumns && leafColumns.length > 0
      ? leafColumns
      : Array.from({ length: FALLBACK_SKELETON_COLUMNS }, (_, index) => ({
          name: `__skeleton_col_${index}`,
          title: ' '
        }));

  return source.map((column, index) => ({
    name: column.name || column.key || `__skeleton_col_${index}`,
    title: typeof column.title === 'function' ? ' ' : (column.title ?? ' '),
    width: column.width,
    min: column.min,
    max: column.max,
    fixed: column.fixed,
    justify: column.justify,
    align: column.align,
    span: column.span,
    valueIsEmpty: () => false,
    getValueOf: () => '__skeleton__',
    render: () => <CellSkeleton />
  }));
};

const buildSkeletonDataSource = (rowCount = SKELETON_ROW_COUNT) =>
  Array.from({ length: rowCount }, (_, index) => ({
    id: `__skeleton_row_${index}`
  }));

/**
 * withFetch 首包 loading：Toolbar/Filter 占位保高 + Table/TableView 骨架屏 + loading，
 * 复用正式表格样式，避免全局绝对定位 Spin 把高度塌成 0。
 */
const TablePageLoadingShell = withLocale(
  ({ filter, search, tab, tabProps, batchActions, buttonGroup, rowSelection, selectedRows, renderMobile = true, renderCard, forceCard = false, columns, getColumns, pagination = {}, className, size, renderType = 'Table' }) => {
    const isMobile = useIsMobile();
    const isMobileRenderActive = isRenderMobileActive(renderMobile, isMobile);
    const showButtonGroup = hasButtonGroupList(buttonGroup);
    const resolvedRenderCard = resolveRenderCard(renderCard);
    const showCardModeToggle = resolvedRenderCard != null && !isMobile && !forceCard;
    const hasTab = !!(tab?.name && Array.isArray(tab.list) && tab.list.length > 0);
    const hasInnerToolbar = !!(filter?.list?.length || (search && search.name) || (batchActions && batchActions.length) || showButtonGroup || showCardModeToggle);
    const showOuterTab = hasTab && !isMobile;
    const showInnerTab = hasTab && isMobile;
    const wrapWithToolbar = hasInnerToolbar || showInnerTab;
    const filterValue = resolveInitialFilterValue(filter);
    const SkeletonTableComponent = TABLE_COMPONENTS[renderType] || Table;
    const useAntdTable = SkeletonTableComponent === Table;

    const skeletonRowCount = Math.min(Math.max(Number(pagination.pageSize) || SKELETON_ROW_COUNT, 3), SKELETON_ROW_COUNT);
    const skeletonColumns = useMemo(() => buildSkeletonTableColumns(resolveLoadingColumns(columns, getColumns)), [columns, getColumns]);
    const skeletonDataSource = useMemo(() => buildSkeletonDataSource(skeletonRowCount), [skeletonRowCount]);
    // 与正式表一致保留选择列占位（含表头全选/隐藏 checkbox 宽度）；禁用交互
    const skeletonRowSelection = useMemo(() => {
      if (!rowSelection) {
        return undefined;
      }
      return {
        type: rowSelection.type === 'radio' ? 'radio' : 'checkbox',
        allowSelectedAll: rowSelection.allowSelectedAll,
        selectedRowKeys: [],
        onChange: noop,
        getCheckboxProps: () => ({ disabled: true })
      };
    }, [rowSelection]);

    const cardModeToggleNode = showCardModeToggle ? (
      <Segmented
        className={style['card-mode-toggle']}
        size="small"
        value="table"
        options={[
          { value: 'table', icon: <TableOutlined /> },
          { value: 'card', icon: <AppstoreOutlined /> }
        ]}
      />
    ) : null;

    // renderType=TableView 时骨架也用 TableView；桌面端 Table 可透传 loading，其余外层 Spin
    const showOuterSpin = isMobileRenderActive || !useAntdTable;
    const tableSkeleton = (
      <SkeletonTableComponent
        key={`skeleton-${renderType}`}
        className={classnames({ [style['table-in-toolbar']]: wrapWithToolbar }, className)}
        columns={skeletonColumns}
        dataSource={skeletonDataSource}
        rowSelection={skeletonRowSelection}
        {...(useAntdTable ? { loading: !showOuterSpin, controllerOpen: false, pagination: false } : null)}
        rowKey="id"
        size={size}
        renderMobile={renderMobile}
        empty={null}
      />
    );

    const skeletonNode = showOuterSpin ? (
      <Spin spinning className={style['table-skeleton-spin']}>
        {tableSkeleton}
      </Spin>
    ) : (
      tableSkeleton
    );

    const toolbarNode = wrapWithToolbar ? (
      <TableToolbar
        filterValue={filterValue}
        onFilterChange={noop}
        filter={filter}
        search={search}
        tab={tab}
        tabProps={tabProps}
        renderTab={showInnerTab}
        batchActions={batchActions}
        buttonGroup={buttonGroup}
        rowSelection={rowSelection}
        selectedRows={selectedRows}
        isMobileRender={isMobileRenderActive}
        cardModeToggle={cardModeToggleNode}
      />
    ) : null;

    return (
      <div className={style['table-page']}>
        <div className={style['table-content']}>
          {showOuterTab ? <TablePageTabs filterValue={filterValue} onFilterChange={noop} tab={tab} tabProps={tabProps} className={style['table-page-tabs-outer']} isMobileRender={isMobileRenderActive} /> : null}
          {wrapWithToolbar ? (
            <div
              className={classnames(style['table-with-toolbar'], style['is-loading-shell'], {
                [style['is-mobile-render']]: isMobileRenderActive
              })}
            >
              {toolbarNode}
              {skeletonNode}
            </div>
          ) : (
            skeletonNode
          )}
        </div>
      </div>
    );
  }
);

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
      // 兼容扁平 list：[{ type, props }]；以及分组 list：[[item, item]]
      if (!Array.isArray(row)) {
        const name = row?.props?.name;
        if (name) {
          names.add(name);
        }
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

const isPlainObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

// lodash.merge 不会删掉「新对象里没有的嵌套 key」，且 [] 合并不了旧数组；清空一律写 null
const withNestedClears = (prevParams, nextParams) => {
  const result = Object.assign({}, nextParams);
  Object.keys(prevParams || {}).forEach(key => {
    const prevVal = prevParams[key];
    const nextVal = nextParams[key];
    if (!isPlainObject(prevVal)) {
      return;
    }
    if (isPlainObject(nextVal)) {
      const nested = {};
      Object.keys(prevVal).forEach(nestedKey => {
        if (!(nestedKey in nextVal)) {
          nested[nestedKey] = null;
        }
      });
      result[key] = Object.assign({}, nested, nextVal);
      return;
    }
    if (nextVal === undefined) {
      // 整个嵌套对象被拿掉时，直接 null 覆盖（比逐字段 { ids: null } 更干净）
      result[key] = null;
    }
  });
  return result;
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
    filterSeedParams = {},
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
      const prevFilterParams = Object.assign({}, getFilterParams(filterValue) || {});
      let filterParams = Object.assign({}, getFilterParams(value) || {});
      Object.keys(filterParams).forEach(key => {
        const v = filterParams[key];
        if (v === undefined || v === '') {
          delete filterParams[key];
        } else if (Array.isArray(v) && v.length === 0) {
          // lodash.merge 用 [] 合并不掉旧数组，改成 null 才能覆盖
          filterParams[key] = null;
        }
      });
      // mapFilterValue 常返回 { filter: {...} }：嵌套里被删掉的字段写成 null，否则 lodash.merge 会残留
      filterParams = withNestedClears(prevFilterParams, filterParams);
      filterParams = withNestedClears(isPlainObject(get(requestParams, [pagination.paramsType, 'filter'])) ? { filter: get(requestParams, [pagination.paramsType, 'filter']) } : {}, filterParams);

      const currentParams = get(requestParams, pagination.paramsType) || {};
      const seedParams = filterSeedParams || {};

      // 待清理 key：配置字段 + 旧筛选 + 首包种子（props.data 里的 filterDefaultParams）
      // react-fetch 用 lodash.merge：省略字段不会覆盖；[] 也合并不掉旧数组，必须显式传 null
      const keysToClear = new Set([...filterFieldNames, ...Object.keys(prevFilterParams), ...Object.keys(seedParams)]);
      Object.keys(filterParams).forEach(key => keysToClear.delete(key));
      keysToClear.delete(pagination.currentName);
      keysToClear.delete(pagination.pageSizeName);

      const cleared = {};
      keysToClear.forEach(name => {
        cleared[name] = null;
      });

      // 旧写法把筛选抬升到 props.params.filter，而 mapFilterValue 仍是扁平字段时：必须清掉嵌套 filter 里的同名字段
      if (isPlainObject(currentParams.filter) && !isPlainObject(filterParams.filter) && filterParams.filter !== null) {
        const nested = {};
        const active = new Set(Object.keys(filterParams));
        new Set([...Object.keys(currentParams.filter), ...filterFieldNames]).forEach(name => {
          if (name === pagination.currentName || name === pagination.pageSizeName) {
            return;
          }
          if (!active.has(name)) {
            nested[name] = null;
          }
        });
        Object.keys(filterParams).forEach(name => {
          if (filterFieldNames.has(name) || name in currentParams.filter) {
            nested[name] = filterParams[name];
            delete filterParams[name];
          }
        });
        filterParams.filter = nested;
      }

      const merged = Object.assign({}, omitFilterParams(currentParams, keysToClear), extra, cleared, filterParams);
      Object.keys(merged).forEach(key => {
        if (merged[key] === undefined) {
          delete merged[key];
        }
      });
      return merged;
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

    const syncPaginationToUrl = useRefCallback((page, size) => {
      if (!isPaginationSearchParamsEnabled(pagination)) {
        return;
      }
      const nextParams = patchPaginationSearchParams(pagination.searchParams, {
        current: page,
        pageSize: size,
        currentName: pagination.currentName,
        pageSizeName: pagination.pageSizeName
      });
      pagination.setSearchParams(nextParams, { replace: true });
    });

    const handleFilterChange = useRefCallback(value => {
      const nextParams = buildRequestParamsWithFilter(value, {
        [pagination.currentName]: 1
      });
      setFilterValue(value);
      const currentSize = Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 20;
      syncPaginationToUrl(1, currentSize);
      reload({
        [pagination.paramsType]: nextParams
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
      const nextSize = Number(size);
      const currentPage = get(requestParams, [pagination.paramsType, pagination.currentName], 1);
      const currentSize = Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 20;

      if (typeof pagination.onChange === 'function') {
        syncPaginationToUrl(page, nextSize || currentSize);
        pagination.onChange(page, size);
        return;
      }

      if (nextSize !== currentSize) {
        pagination.onShowSizeChange && pagination.onShowSizeChange(page, nextSize);
      }

      if (page !== currentPage || nextSize !== currentSize) {
        syncPaginationToUrl(page, nextSize);
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
    const currentPageSize = Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 20;
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
        pageSize: Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 20,
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
      <HorizontalScroller ref={tableContentRef} enabled={horizontalScroller && renderType === 'Table' && !isCardModeActive} getPortalContainer={getScrollContainer} className={style['table-content']}>
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
      <div
        className={classnames(style['table-page'], 'loading-container', {
          // reload 会保留旧 data，仅将 isComplete 置为 false；用蒙层提示切换中，避免卸载表格
          'is-loading': !isComplete
        })}
        style={scrollTopInsetStyle}
      >
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

const TablePageFetched = withFetch(TablePageInnerContent);

// 首包 / refresh loading：Toolbar 占位 + cell 骨架屏 + Spin；外层 grid 再垫一层，盖住首帧 null
const TablePageInner = forwardRef((props, ref) => {
  const isMobile = useIsMobile();
  const { loading: loadingProp, ...rest } = props;
  const reserveToolbar = hasToolbarArea(props, isMobile);
  const loading = loadingProp !== undefined ? loadingProp : <TablePageLoadingShell {...props} />;
  const fetched = <TablePageFetched {...rest} loading={loading} ref={ref} />;
  if (!reserveToolbar) {
    return fetched;
  }
  return (
    <div className={style['fetch-stack']}>
      <div className={style['toolbar-height-reserve']} aria-hidden />
      {fetched}
    </div>
  );
});

const TablePage = forwardRef(({ pagination, horizontalScroller = true, getScrollContainer, filter: filterProp, ...props }, ref) => {
  pagination = Object.assign(
    {},
    {
      showSizeChanger: true,
      showQuickJumper: true,
      hideOnSinglePage: true,
      open: true,
      paramsType: 'data',
      requestType: 'reload',
      currentName: 'currentPage',
      pageSizeName: 'perPage',
      pageSize: 20
    },
    pagination
  );
  const pageSizeKey = `${(props.name || 'common').toUpperCase()}_TABLE_PAGE_SIZE`;
  const cachePageSize = pagination.cachePageSize !== false;
  const paginationUrlEnabled = isPaginationSearchParamsEnabled(pagination);
  const [urlPagination] = useState(() =>
    paginationUrlEnabled
      ? parsePaginationSearchParams(pagination.searchParams, {
          currentName: pagination.currentName,
          pageSizeName: pagination.pageSizeName
        })
      : {}
  );
  const [pageSize, setPageSize] = useState(() => urlPagination.pageSize ?? (cachePageSize ? readPageSize(pageSizeKey) : null) ?? pagination.pageSize);
  const [initialCurrent] = useState(() => {
    if (urlPagination.current != null) {
      return urlPagination.current;
    }
    const fromProps = Number(get(props[pagination.paramsType], pagination.currentName));
    return Number.isFinite(fromProps) && fromProps > 0 ? fromProps : 1;
  });

  const [searchParamsSnapshot] = useState(() => parseSearchParamsValue(filterProp?.searchParamsValue));
  const { items: fromUrl, consumedKeys } = searchParamsSnapshot;

  const filter = useMemo(() => {
    if (!filterProp) {
      return filterProp;
    }
    const { searchParamsValue: _searchParamsValue, ...rest } = filterProp;
    if ('value' in filterProp) {
      return rest;
    }
    return Object.assign({}, rest, {
      defaultValue: mergeFilterByName(filterProp.defaultValue || [], fromUrl)
    });
  }, [filterProp, fromUrl]);

  const params = props[pagination.paramsType];
  // 仅作首包种子；后续筛选走 handleFilterChange → reload，避免受控 value 变化改 requestToken 触发 refresh 卸载表格
  const [filterDefaultParams] = useState(() => {
    if (!filterProp) {
      return {};
    }
    const mapFn = filterProp.mapFilterValue || getFilterValue;
    const initialValue = 'value' in filterProp ? mergeFilterByName(filterProp.value || [], fromUrl) : mergeFilterByName(filterProp.defaultValue || [], fromUrl);
    if (!initialValue.length && !filterProp.mapFilterValue) {
      return {};
    }
    return mapFn(initialValue) || {};
  });

  const urlStrippedRef = useRef(false);
  useEffect(() => {
    if (urlStrippedRef.current) {
      return;
    }
    urlStrippedRef.current = true;
    const setSearchParams = filterProp?.searchParamsValue?.setSearchParams;
    const searchParams = filterProp?.searchParamsValue?.searchParams;
    if (typeof setSearchParams !== 'function') {
      return;
    }
    const nextParams = stripConsumedUrlParams(searchParams, consumedKeys);
    if (nextParams) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filterProp, consumedKeys]);

  const fetchParams = useMemo(() => {
    return {
      [pagination.paramsType]: Object.assign({}, params, filterDefaultParams, {
        ...(paginationUrlEnabled ? { [pagination.currentName]: initialCurrent } : null),
        [pagination.pageSizeName]: pageSize
      })
    };
  }, [params, pagination.pageSizeName, pagination.paramsType, pagination.currentName, pageSize, filterDefaultParams, paginationUrlEnabled, initialCurrent]);
  return (
    <TablePageInner
      {...props}
      {...fetchParams}
      filter={filter}
      filterSeedParams={filterDefaultParams}
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
