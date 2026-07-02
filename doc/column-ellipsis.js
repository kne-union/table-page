const { Table, TableView } = _TablePage;
const { Flex, Tag } = antd;
const { useMemo } = React;

const orderStatusMap = {
  已完成: { type: 'success', text: '已完成' },
  处理中: { type: 'processing', text: '处理中' },
  待发货: { type: 'warning', text: '待发货' }
};

const dataSource = [
  {
    id: 'ORD001',
    customerName: '深圳市腾讯计算机系统有限公司深圳总部研发中心',
    remark: '客户要求春节前完成交付，需协调物流加急处理，并同步更新合同附件与验收标准说明文档。',
    amount: 42500,
    status: '待发货'
  },
  {
    id: 'ORD002',
    customerName: '华为技术有限公司坂田基地采购中心',
    remark: '项目处于需求评审阶段，待客户确认最终配置清单后安排发货。',
    amount: 85000,
    status: '处理中'
  },
  {
    id: 'ORD003',
    customerName: '阿里巴巴集团控股有限公司滨江园区',
    remark: '已完成付款，仓库正在拣货，预计两个工作日内发出第一批货物。',
    amount: 120000,
    status: '待发货'
  }
];

const columns = [
  { name: 'id', title: '订单编号（系统流水号）', width: 110, renderType: 'small' },
  {
    name: 'customerName',
    title: '客户名称（签约主体全称）',
    width: 140,
    renderType: 'main',
    ellipsis: true
  },
  {
    name: 'remark',
    title: '备注说明（内部流转备注）',
    width: 160,
    renderType: 'description',
    ellipsis: { showTitle: true }
  },
  {
    name: 'amount',
    title: '订单应付金额（含税，单位：元）',
    width: 120,
    sort: true,
    renderType: 'amount',
    format: 'number-style:decimal-maximumFractionDigits:0-useGrouping:true-suffix:元'
  },
  {
    name: 'status',
    title: '订单履约状态（业务状态）',
    width: 100,
    renderType: 'status',
    getValueOf: item => orderStatusMap[item.status] || { type: 'default', text: item.status }
  }
];

const TIP_TAG_STYLE = { marginRight: 8 };

const Tips = () => (
  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
    <div>
      <Tag style={TIP_TAG_STYLE} color="blue">表头省略</Tag>
      列 <code>title</code> 超出列宽时自动单行省略，悬停 tooltip 显示完整标题；带排序的列同样生效（<code>Table</code> / <code>TableView</code> 均支持，无需额外配置）。
    </div>
    <div>
      <Tag style={TIP_TAG_STYLE} color="green">单元格省略</Tag>
      列配置 <code>ellipsis: true</code> 或 <code>ellipsis: {'{ showTitle: true }'}</code>，单元格内容超出时省略，悬停显示完整内容（基于 antd Typography）。
    </div>
    <div style={{ color: '#999' }}>
      本示例刻意使用较长表头与较窄列宽，便于观察省略与 tooltip 效果；可将鼠标悬停在表头或单元格上查看。
    </div>
  </div>
);

const TableExample = () => {
  const { sort, sortRender } = Table.useSort({});
  const sortedData = useMemo(() => Table.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>Table（含排序表头省略）</div>
      <Table dataSource={sortedData} columns={columns} sortRender={sortRender} scroll={{ x: 700 }} />
    </div>
  );
};

const TableViewExample = () => {
  const { sort, sortRender } = TableView.useSort({});
  const sortedData = useMemo(() => TableView.sortDataSource(dataSource, sort, columns), [sort]);

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>TableView（含排序表头省略）</div>
      <TableView dataSource={sortedData} columns={columns} sortRender={sortRender} />
    </div>
  );
};

const BaseExample = () => {
  return (
    <Flex vertical gap={24}>
      <Tips />
      <TableExample />
      <TableViewExample />
    </Flex>
  );
};

render(<BaseExample />);
