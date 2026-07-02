const { Table } = _TablePage;
const { Flex, Tag } = antd;
const { useMemo } = React;

const dataSource = [
  {
    id: 'SALE001',
    region: '华北区',
    province: '北京',
    city: '北京',
    productName: '企业版 SaaS',
    productCode: 'SAAS-ENT',
    salesAmount: 1250000,
    salesVolume: 50,
    growthRate: 23.5,
    marketShare: 18.2,
    customerCount: 128,
    newCustomerCount: 32,
    repurchaseRate: 85.5,
    avgOrderValue: 9765.6,
    targetCompletion: 92.5
  },
  {
    id: 'SALE002',
    region: '华东区',
    province: '上海',
    city: '上海',
    productName: '企业版 SaaS',
    productCode: 'SAAS-ENT',
    salesAmount: 1680000,
    salesVolume: 68,
    growthRate: 35.2,
    marketShare: 22.8,
    customerCount: 156,
    newCustomerCount: 45,
    repurchaseRate: 88.6,
    avgOrderValue: 24705.9,
    targetCompletion: 105.2
  },
  {
    id: 'SALE003',
    region: '华南区',
    province: '广东',
    city: '深圳',
    productName: '专业版 SaaS',
    productCode: 'SAAS-PRO',
    salesAmount: 980000,
    salesVolume: 95,
    growthRate: 28.6,
    marketShare: 16.3,
    customerCount: 112,
    newCustomerCount: 28,
    repurchaseRate: 82.4,
    avgOrderValue: 10315.8,
    targetCompletion: 95.8
  }
];

const growthRateRender = value => (
  <span style={{ color: value > 20 ? '#52c41a' : value > 10 ? '#1677ff' : '#faad14' }}>{value}%</span>
);

const columns = [
  {
    name: 'region',
    title: '大区',
    width: 100,
    groupHeader: [{ name: 'area', title: '区域信息' }]
  },
  {
    name: 'province',
    title: '省份',
    width: 100,
    groupHeader: [{ name: 'area', title: '区域信息' }]
  },
  {
    name: 'city',
    title: '城市',
    width: 100,
    groupHeader: [{ name: 'area', title: '区域信息' }]
  },
  {
    name: 'productName',
    title: '产品名称',
    width: 150,
    renderType: 'main',
    groupHeader: [{ name: 'product', title: '产品信息' }]
  },
  {
    name: 'productCode',
    title: '产品编码',
    width: 130,
    groupHeader: [{ name: 'product', title: '产品信息' }]
  },
  {
    name: 'salesAmount',
    title: '销售金额',
    width: 130,
    sort: { single: true },
    render: value => <strong style={{ color: '#f5222d' }}>¥{(value / 10000).toFixed(2)}万</strong>,
    groupHeader: [{ name: 'sales', title: '销售业绩' }]
  },
  {
    name: 'salesVolume',
    title: '销售数量',
    width: 110,
    sort: true,
    groupHeader: [{ name: 'sales', title: '销售业绩' }]
  },
  {
    name: 'growthRate',
    title: '增长率',
    width: 110,
    sort: true,
    render: growthRateRender,
    groupHeader: [{ name: 'sales', title: '销售业绩' }]
  },
  {
    name: 'marketShare',
    title: '市场份额',
    width: 110,
    sort: true,
    render: value => `${value}%`,
    groupHeader: [{ name: 'market', title: '市场分析' }]
  },
  {
    name: 'customerCount',
    title: '客户总数',
    width: 110,
    sort: true,
    groupHeader: [{ name: 'market', title: '市场分析' }]
  },
  {
    name: 'newCustomerCount',
    title: '新增客户',
    width: 110,
    sort: true,
    groupHeader: [{ name: 'market', title: '市场分析' }]
  },
  {
    name: 'repurchaseRate',
    title: '复购率',
    width: 110,
    render: value => `${value}%`,
    groupHeader: [{ name: 'customer', title: '客户指标' }]
  },
  {
    name: 'avgOrderValue',
    title: '客单价',
    width: 120,
    render: value => `¥${value.toLocaleString()}`,
    groupHeader: [{ name: 'customer', title: '客户指标' }]
  },
  {
    name: 'targetCompletion',
    title: '目标完成率',
    width: 130,
    sort: true,
    render: value => (
      <span style={{ color: value >= 100 ? '#52c41a' : value >= 90 ? '#1677ff' : '#faad14' }}>{value}%</span>
    ),
    groupHeader: [{ name: 'target', title: '目标达成' }]
  }
];

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag color="blue">groupHeader</Tag>
      在列配置中通过 <code>groupHeader</code> 声明所属分组，相同 <code>name</code> 的列会自动合并为多级表头（仅 <code>Table</code> 支持）。
    </div>
    <div>
      <Tag color="green">多级分组</Tag>
      <code>groupHeader</code> 为数组，按层级嵌套，例如{' '}
      <code>{`[{ name: 'sales', title: '销售业绩' }, { name: 'detail', title: '明细' }]`}</code>。
    </div>
    <div>
      <Tag color="orange">排序</Tag>
      分组表头可与 <code>useSort</code> 配合，排序按钮显示在叶子列表头。
    </div>
  </div>
);

const BaseExample = () => {
  const { sort, sortRender } = Table.useSort({
    onSortChange: value => console.log('排序变更:', value)
  });
  const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <Flex vertical gap={24}>
      <Tips />
      <Table dataSource={sortedData} columns={columns} sortRender={sortRender} scroll={{ x: 1600 }} />
    </Flex>
  );
};

render(<BaseExample />);
