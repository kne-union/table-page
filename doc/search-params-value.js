const { default: TablePage } = _TablePage;
const { fields } = _ReactFilter;
const { InputFilterItem } = fields;
const { Flex, Typography, Card } = antd;
const { useMemo, useState } = React;

const mockUsers = [
  { id: '1', name: 'Alice', userId: 'u-1001', tenantId: 't-88' },
  { id: '2', name: 'Bob', userId: 'u-1002', tenantId: 't-88' },
  { id: '3', name: 'Carol', userId: 'u-2002', tenantId: 't-99' }
];

/**
 * TablePage filter.searchParamsValue：与 useSearchParamsValue 同参。
 * 非受控 defaultValue 与 URL 按 name 合并（URL 同名覆盖）；首包请求参数已含合并结果。
 */
const BaseExample = () => {
  const [lastRequest, setLastRequest] = useState(null);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('userId', 'u-1001');
    return params;
  }, []);

  const [liveSearch, setLiveSearch] = useState(searchParams);

  return (
    <Flex vertical gap={16}>
      <Card size="small" title="说明">
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          模拟 URL <Typography.Text code>?userId=u-1001</Typography.Text>，并配置 defaultValue 含 status。合并后首包应同时带上 status 与 userId。
        </Typography.Paragraph>
      </Card>
      {lastRequest ? (
        <Card size="small" title="首次/最近请求 data 参数">
          <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(lastRequest, null, 2)}</pre>
        </Card>
      ) : null}
      <TablePage
        name="search-params-value-demo"
        data={{ currentPage: 1, perPage: 10 }}
        pagination={{ paramsType: 'data' }}
        filter={{
          defaultValue: [{ name: 'status', label: '状态', value: { label: '开启', value: 'open' } }],
          searchParamsValue: {
            searchParams: liveSearch,
            setSearchParams: next => setLiveSearch(next),
            fields: [
              { name: 'userId', label: '用户Id' },
              { name: 'tenantId', label: '租户Id' }
            ]
          },
          list: [
            [
              { type: InputFilterItem, props: { name: 'userId', label: '用户Id' } },
              { type: InputFilterItem, props: { name: 'tenantId', label: '租户Id' } },
              { type: InputFilterItem, props: { name: 'status', label: '状态' } }
            ]
          ]
        }}
        loader={({ data }) => {
          setLastRequest(data);
          const list = mockUsers.filter(row => {
            if (data.userId && row.userId !== data.userId) return false;
            if (data.tenantId && row.tenantId !== data.tenantId) return false;
            return true;
          });
          return Promise.resolve({
            pageData: list,
            totalCount: list.length
          });
        }}
        columns={[
          { name: 'name', title: '姓名', type: 'main' },
          { name: 'userId', title: '用户Id' },
          { name: 'tenantId', title: '租户Id' }
        ]}
      />
      <Typography.Text type="secondary">当前 search：?{liveSearch.toString() || '(已清理)'}</Typography.Text>
    </Flex>
  );
};

render(<BaseExample />);
