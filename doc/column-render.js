const { Table, TableView } = _TablePage;
const { Flex, Tag } = antd;

const statusMap = {
  待发货: { type: 'warning', text: '待发货' },
  处理中: { type: 'processing', text: '处理中' },
  已完成: { type: 'success', text: '已完成' }
};

const dataSource = [
  {
    id: 'ORD001',
    customerName: '深圳市腾讯计算机系统有限公司',
    amount: 42500,
    status: '待发货'
  },
  {
    id: 'ORD002',
    customerName: '华为技术有限公司',
    amount: 85000,
    status: '处理中'
  },
  {
    id: 'ORD003',
    customerName: '阿里巴巴集团控股有限公司',
    amount: 120000,
    status: '已完成'
  }
];

const columns = [
  { name: 'id', title: '编号', renderType: 'small' },
  { name: 'customerName', title: '客户名称', renderType: 'main' },
  {
    name: 'amount',
    title: '金额',
    renderType: 'amount',
    format: 'number-style:decimal-maximumFractionDigits:0-useGrouping:true-suffix:元'
  },
  {
    name: 'status',
    title: '状态（仅 renderType）',
    renderType: 'status',
    getValueOf: item => statusMap[item.status]
  },
  {
    name: 'statusRender',
    title: '状态（render 优先）',
    renderType: 'status',
    getValueOf: item => statusMap[item.status],
    render: (value, { dataSource }) => (
      <span style={{ color: '#1677ff' }}>
        自定义渲染：{dataSource.status}（未走 status Badge）
      </span>
    )
  }
];

const BaseExample = () => {
  return (
    <Flex vertical gap={24}>
      <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
        <p>
          列同时配置 <code>render</code> 与 <code>renderType</code> 时，
          <Tag color="blue" style={{ margin: '0 4px' }}>render 优先级最高</Tag>
          ，会直接使用自定义 <code>render</code>，不再走内置 renderType。
        </p>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li>「状态（仅 renderType）」列：走内置 <code>status</code>，渲染 Badge</li>
          <li>「状态（render 优先）」列：同样写了 <code>renderType: 'status'</code>，但因存在 <code>render</code>，最终显示自定义内容</li>
          <li>renderType 仍可提供列宽等维度（width / min / max），仅单元格内容渲染被 <code>render</code> 覆盖</li>
        </ul>
      </div>
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>Table</div>
        <Table dataSource={dataSource} columns={columns} scroll={{ x: 1200 }} />
      </div>
      <div>
        <div style={{ marginBottom: 8, color: '#666' }}>TableView</div>
        <TableView dataSource={dataSource} columns={columns} />
      </div>
    </Flex>
  );
};

render(<BaseExample />);
