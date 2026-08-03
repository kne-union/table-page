const { default: TablePage } = _TablePage;
const { Flex, Typography, Card } = antd;
const { useMemo, useState } = React;

const TOTAL = 56;
const range = (start, end) => Array.from({ length: end - start }, (_, i) => start + i);

/**
 * pagination.searchParams + setSearchParams：当前页 / 每页条数与 URL 双向同步。
 * 模拟落地 ?currentPage=2&perPage=10，翻页或改 pageSize 后 URL 会 replace 更新。
 */
const BaseExample = () => {
  const initialSearchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('currentPage', '2');
    params.set('perPage', '10');
    return params;
  }, []);

  const [liveSearch, setLiveSearch] = useState(initialSearchParams);
  const [lastRequest, setLastRequest] = useState(null);

  return (
    <Flex vertical gap={16}>
      <Card size="small" title="说明">
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          模拟 URL <Typography.Text code>?currentPage=2&perPage=10</Typography.Text>
          。首包应请求第 2 页、每页 10 条；翻页或切换每页条数后下方 search 同步更新（replace）。
        </Typography.Paragraph>
      </Card>
      {lastRequest ? (
        <Card size="small" title="最近请求 data 参数">
          <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(lastRequest, null, 2)}</pre>
        </Card>
      ) : null}
      <TablePage
        name="pagination-search-params-demo"
        pagination={{
          paramsType: 'data',
          searchParams: liveSearch,
          setSearchParams: next => setLiveSearch(next),
          pageSizeOptions: ['10', '20', '50'],
          showSizeChanger: true,
          hideOnSinglePage: false,
          cachePageSize: false
        }}
        loader={({ data }) => {
          setLastRequest(data);
          const currentPage = Number(data.currentPage) || 1;
          const perPage = Number(data.perPage) || 10;
          const start = (currentPage - 1) * perPage;
          const pageData = range(start, Math.min(start + perPage, TOTAL)).map(index => ({
            id: String(index + 1),
            name: `用户 ${index + 1}`,
            no: `NO-${String(index + 1).padStart(3, '0')}`
          }));
          return Promise.resolve({
            pageData,
            totalCount: TOTAL
          });
        }}
        columns={[
          { name: 'no', title: '编号', type: 'main' },
          { name: 'name', title: '姓名' }
        ]}
      />
      <Typography.Text type="secondary">当前 search：?{liveSearch.toString() || '(空)'}</Typography.Text>
    </Flex>
  );
};

render(<BaseExample />);
