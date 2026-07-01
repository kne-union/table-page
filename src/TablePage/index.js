import { withFetch } from '@kne/react-fetch';
import { Pagination } from 'antd';
import Table from '../Table';
import TableView from '../TableView';
import classnames from 'classnames';
import get from 'lodash/get';
import useRefCallback from '@kne/use-ref-callback';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from '@kne/react-intl';
import style from './style.module.scss';
import withLocale from '../withLocale';
import HorizontalScroller from './HorizontalScroller';
import { getTableElement, isTopEdgeInViewport, parsePixelValue } from './scrollUtils';

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

const isTableTopInViewport = target => {
  const scrollMarginTop = parsePixelValue(getComputedStyle(target).scrollMarginTop);
  return isTopEdgeInViewport(target, scrollMarginTop);
};

const scrollTableIntoView = root => {
  const target = getTableElement(root);
  if (!target) {
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (isTableTopInViewport(target)) {
        return;
      }
      target.scrollIntoView({ block: 'start', inline: 'nearest' });
    });
  });
};

const TABLE_COMPONENTS = {
  Table,
  TableView
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
    renderType = 'Table',
    horizontalScroller = true,
    getScrollContainer,
    ...props
  }) => {
    const { formatMessage } = useIntl();
    const tableContentRef = useRef(null);
    const pendingScrollRef = useRef(false);
    const handlerDataFormat = useRefCallback(dataFormat);
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

    const scrollTable = useRefCallback(() => {
      scrollTableIntoView(tableContentRef.current);
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
      if (page !== get(requestParams, [pagination.paramsType, pagination.currentName], 1)) {
        (pagination.requestType === 'refresh' ? refresh : reload)({
          [pagination.paramsType]: {
            [pagination.currentName]: page,
            [pagination.pageSizeName]: Number(size)
          }
        });
      } else {
        pagination.onShowSizeChange && pagination.onShowSizeChange(page, Number(size));
      }
    });

    const paginationConfig = useMemo(() => {
      if (!pagination.open) {
        return null;
      }
      return {
        total: formatData.total,
        showTotal:
          typeof pagination.showTotal === 'function'
            ? pagination.showTotal
            : total => (
                <>
                  {formatMessage({ id: 'TotalText' })}&nbsp;
                  <span className={style['total_text']}>{total}</span>
                  &nbsp;
                  {formatMessage({ id: 'ItemText' })}
                </>
              ),
        current: get(requestParams, [pagination.paramsType, pagination.currentName], 1),
        pageSize: Number(get(requestParams, [pagination.paramsType, pagination.pageSizeName], pagination.pageSize)) || pagination.pageSize || 20,
        onChange: handlePaginationChange,
        size: pagination.size,
        hideOnSinglePage: pagination.hideOnSinglePage,
        showSizeChanger: pagination.showSizeChanger,
        showQuickJumper: pagination.showQuickJumper,
        pageSizeOptions: pagination.pageSizeOptions
      };
    }, [pagination, formatData.total, requestParams, formatMessage, handlePaginationChange]);

    const tableProps = {
      ...props,
      dataSource: formatData.list,
      pagination: false,
      sticky,
      className,
      columns: resolvedColumns,
      columnRenderProps: {
        ...columnRenderProps,
        requestParams,
        fetchProps,
        data
      },
      summary:
        typeof summary === 'function'
          ? (pageData, ...args) => {
              return summary(Object.assign({}, fetchContext, { pageData }, ...args));
            }
          : null
    };

    const TableComponent = TABLE_COMPONENTS[renderType] || Table;

    return (
      <div className={style['table-page']}>
        <HorizontalScroller
          ref={tableContentRef}
          enabled={horizontalScroller && renderType === 'Table'}
          getPortalContainer={getScrollContainer}
          className={classnames(style['table-content'], 'loading-container', {
            'is-loading': !isComplete && !data
          })}
        >
          <TableComponent {...tableProps} />
        </HorizontalScroller>
        {paginationConfig ? <Pagination className={style['pagination']} {...paginationConfig} /> : null}
      </div>
    );
  }
);

const TablePageInner = withFetch(TablePageInnerContent);

const TablePage = forwardRef(({ pagination, ...props }, ref) => {
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
      pageSize: 20
    },
    pagination
  );
  const pageSizeKey = `${(props.name || 'common').toUpperCase()}_TABLE_PAGE_SIZE`;
  const [pageSize, setPageSize] = useState(() => readPageSize(pageSizeKey) ?? pagination.pageSize);
  const params = props[pagination.paramsType];
  const fetchParams = useMemo(() => {
    return {
      [pagination.paramsType]: Object.assign({}, params, {
        [pagination.pageSizeName]: pageSize
      })
    };
  }, [params, pagination.pageSizeName, pagination.paramsType, pageSize]);
  return (
    <TablePageInner
      {...props}
      {...fetchParams}
      pagination={Object.assign({}, pagination, {
        pageSize,
        onShowSizeChange: (current, size) => {
          const nextSize = Number(size);
          writePageSize(pageSizeKey, nextSize);
          setPageSize(nextSize);
        }
      })}
      ref={ref}
    />
  );
});

export default TablePage;
